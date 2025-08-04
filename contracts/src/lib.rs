use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
    program::{invoke, invoke_signed},
    sysvar::{rent::Rent, Sysvar},
    clock::Clock,
};
use std::convert::TryInto;

// Program entry point
entrypoint!(process_instruction);

// Program states
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub enum PowerPayInstruction {
    // Initialize a new payment channel between payer and payee
    InitChannel {
        // Total amount of funds to lock in the channel
        amount: u64,
        // Optional expiration timestamp
        expiry_timestamp: u64,
    },
    // Add micropayment intent (accumulates but doesn't execute)
    AddMicroPaymentIntent {
        // Amount of the micropayment intent
        amount: u64,
    },
    // Process probabilistic payment (may or may not execute based on probability)
    ProcessProbabilisticPayment {
        // Random seed provided by client for probabilistic execution
        random_seed: u64,
    },
    // Close the channel and settle final balance
    CloseChannel {},
}

// Payment channel state
#[derive(BorshSerialize, BorshDeserialize, Debug, Default)]
pub struct PaymentChannel {
    // Is the channel initialized
    is_initialized: bool,
    // Payer's public key
    payer: Pubkey,
    // Payee's public key
    payee: Pubkey,
    // Total amount locked in the channel
    total_amount: u64,
    // Amount already paid out
    paid_amount: u64,
    // Accumulated micropayment intent amount
    accumulated_intent: u64,
    // Probability threshold for payments (0-10000, representing 0-100%)
    probability_threshold: u16,
    // Channel expiration timestamp
    expiry_timestamp: u64,
}

// The size of payment channel data
pub const PAYMENT_CHANNEL_SIZE: usize = 1 + 32 + 32 + 8 + 8 + 8 + 2 + 8;

// Process instruction entrypoint
pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    // Deserialize instruction data
    let instruction = PowerPayInstruction::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;

    match instruction {
        PowerPayInstruction::InitChannel { amount, expiry_timestamp } => {
            process_init_channel(program_id, accounts, amount, expiry_timestamp)
        }
        PowerPayInstruction::AddMicroPaymentIntent { amount } => {
            process_add_micropayment_intent(program_id, accounts, amount)
        }
        PowerPayInstruction::ProcessProbabilisticPayment { random_seed } => {
            process_probabilistic_payment(program_id, accounts, random_seed)
        }
        PowerPayInstruction::CloseChannel {} => {
            process_close_channel(program_id, accounts)
        }
    }
}

// Initialize a new payment channel
fn process_init_channel(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
    expiry_timestamp: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    // Get accounts
    let payer_account = next_account_info(account_info_iter)?;
    let payee_account = next_account_info(account_info_iter)?;
    let payment_channel_account = next_account_info(account_info_iter)?;
    let system_program = next_account_info(account_info_iter)?;
    
    // Verify account ownership
    if !payer_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    // Create payment channel account
    let rent = Rent::get()?;
    let rent_lamports = rent.minimum_balance(PAYMENT_CHANNEL_SIZE);
    
    invoke(
        &system_instruction::create_account(
            payer_account.key,
            payment_channel_account.key,
            rent_lamports + amount,
            PAYMENT_CHANNEL_SIZE as u64,
            program_id,
        ),
        &[
            payer_account.clone(),
            payment_channel_account.clone(),
            system_program.clone(),
        ],
    )?;
    
    // Initialize payment channel data
    let mut payment_channel_data = PaymentChannel {
        is_initialized: true,
        payer: *payer_account.key,
        payee: *payee_account.key,
        total_amount: amount,
        paid_amount: 0,
        accumulated_intent: 0,
        probability_threshold: 100, // Default: 1% probability (100 out of 10000)
        expiry_timestamp,
    };
    
    payment_channel_data.serialize(&mut &mut payment_channel_account.data.borrow_mut()[..])?;
    
    msg!("Payment channel initialized: {} lamports", amount);
    Ok(())
}

// Add a micropayment intent (accumulate without executing)
fn process_add_micropayment_intent(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    amount: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    // Get accounts
    let payer_account = next_account_info(account_info_iter)?;
    let payment_channel_account = next_account_info(account_info_iter)?;
    
    // Verify account ownership
    if !payer_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    if payment_channel_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    
    // Deserialize payment channel state
    let mut payment_channel = PaymentChannel::try_from_slice(&payment_channel_account.data.borrow())?;
    
    // Verify the payer
    if payment_channel.payer != *payer_account.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Check if channel has expired
    let clock = Clock::get()?;
    if payment_channel.expiry_timestamp > 0 && clock.unix_timestamp as u64 > payment_channel.expiry_timestamp {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Update accumulated intent
    payment_channel.accumulated_intent = payment_channel.accumulated_intent.saturating_add(amount);
    
    // Check we don't exceed total amount
    if payment_channel.paid_amount.saturating_add(payment_channel.accumulated_intent) > payment_channel.total_amount {
        return Err(ProgramError::InsufficientFunds);
    }
    
    // Save updated state
    payment_channel.serialize(&mut &mut payment_channel_account.data.borrow_mut()[..])?;
    
    msg!("Micropayment intent added: {} lamports, accumulated: {}", 
         amount, payment_channel.accumulated_intent);
    
    Ok(())
}

// Process a probabilistic payment - core of the mechanism
fn process_probabilistic_payment(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    random_seed: u64,
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    // Get accounts
    let payer_account = next_account_info(account_info_iter)?;
    let payee_account = next_account_info(account_info_iter)?;
    let payment_channel_account = next_account_info(account_info_iter)?;
    
    // Verify account ownership
    if !payer_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    if payment_channel_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    
    // Deserialize payment channel state
    let mut payment_channel = PaymentChannel::try_from_slice(&payment_channel_account.data.borrow())?;
    
    // Verify the payer and payee
    if payment_channel.payer != *payer_account.key || payment_channel.payee != *payee_account.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Check if channel has expired
    let clock = Clock::get()?;
    if payment_channel.expiry_timestamp > 0 && clock.unix_timestamp as u64 > payment_channel.expiry_timestamp {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // No accumulated intent to process
    if payment_channel.accumulated_intent == 0 {
        msg!("No accumulated payment intent to process");
        return Ok(());
    }
    
    // Calculate probability - combine timestamp, random seed, and accumulated intent
    // to generate a pseudo-random number between 0 and 9999
    let timestamp = clock.unix_timestamp as u64;
    let probability_seed = timestamp
        .saturating_add(random_seed)
        .saturating_add(payment_channel.accumulated_intent);
    
    // Generate a number between 0-9999 using our seed
    let random_value = (probability_seed % 10000) as u16;
    
    // Determine if payment should be executed based on probability threshold
    let execute_payment = random_value < payment_channel.probability_threshold;
    
    if execute_payment {
        // Transfer funds from payment channel to payee
        let payment_amount = payment_channel.accumulated_intent;
        
        // Ensure we have enough funds in the channel
        let available_funds = **payment_channel_account.lamports.borrow();
        let minimum_rent = Rent::get()?.minimum_balance(PAYMENT_CHANNEL_SIZE);
        
        if available_funds < minimum_rent.saturating_add(payment_amount) {
            return Err(ProgramError::InsufficientFunds);
        }
        
        // Transfer funds
        **payment_channel_account.try_borrow_mut_lamports()? = available_funds.saturating_sub(payment_amount);
        **payee_account.try_borrow_mut_lamports()? = payee_account.lamports().saturating_add(payment_amount);
        
        // Update state
        payment_channel.paid_amount = payment_channel.paid_amount.saturating_add(payment_amount);
        payment_channel.accumulated_intent = 0;
        
        msg!("Probabilistic payment executed! Amount: {} lamports", payment_amount);
    } else {
        msg!("Probabilistic payment skipped this time (threshold not met)");
    }
    
    // Save updated state
    payment_channel.serialize(&mut &mut payment_channel_account.data.borrow_mut()[..])?;
    
    Ok(())
}

// Close the payment channel and settle final balance
fn process_close_channel(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
) -> ProgramResult {
    let account_info_iter = &mut accounts.iter();
    
    // Get accounts
    let payer_account = next_account_info(account_info_iter)?;
    let payee_account = next_account_info(account_info_iter)?;
    let payment_channel_account = next_account_info(account_info_iter)?;
    
    // Verify account ownership
    if !payer_account.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }
    
    if payment_channel_account.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    
    // Deserialize payment channel state
    let payment_channel = PaymentChannel::try_from_slice(&payment_channel_account.data.borrow())?;
    
    // Verify the payer and payee
    if payment_channel.payer != *payer_account.key || payment_channel.payee != *payee_account.key {
        return Err(ProgramError::InvalidAccountData);
    }
    
    // Check if channel has expired or if it's a manual closure
    let clock = Clock::get()?;
    let channel_expired = payment_channel.expiry_timestamp > 0 && 
                         clock.unix_timestamp as u64 > payment_channel.expiry_timestamp;
    
    // If there's any accumulated intent not yet paid, process it as a regular (non-probabilistic) payment
    let remaining_intent = payment_channel.accumulated_intent;
    
    if remaining_intent > 0 {
        // Transfer remaining intent to payee
        **payment_channel_account.try_borrow_mut_lamports()? = payment_channel_account.lamports()
            .saturating_sub(remaining_intent);
        **payee_account.try_borrow_mut_lamports()? = payee_account.lamports()
            .saturating_add(remaining_intent);
        
        msg!("Remaining payment intent of {} lamports settled", remaining_intent);
    }
    
    // Return remaining funds to payer and close account
    let rent = Rent::get()?;
    let minimum_rent = rent.minimum_balance(PAYMENT_CHANNEL_SIZE);
    
    let remaining_balance = payment_channel_account.lamports()
        .saturating_sub(payment_channel.paid_amount)
        .saturating_sub(remaining_intent);
    
    // Transfer remaining funds back to payer
    **payment_channel_account.try_borrow_mut_lamports()? = 0; // Close the account
    **payer_account.try_borrow_mut_lamports()? = payer_account.lamports()
        .saturating_add(remaining_balance);
    
    msg!("Payment channel closed. Returned {} lamports to payer", remaining_balance);
    
    Ok(())
}

// Calculate probability threshold based on accumulated intent amount
// This allows dynamic adjustment of probability based on payment size
pub fn calculate_dynamic_threshold(accumulated_amount: u64) -> u16 {
    // Base probability threshold (1% chance) - 100 out of 10000
    const BASE_THRESHOLD: u16 = 100;
    
    // For micropayments (small amounts), use a lower probability to batch more payments
    if accumulated_amount < 10_000 {
        return BASE_THRESHOLD;
    }
    // For medium amounts, increase probability slightly
    else if accumulated_amount < 100_000 {
        return BASE_THRESHOLD * 2;
    }
    // For larger amounts, increase probability further
    else if accumulated_amount < 1_000_000 {
        return BASE_THRESHOLD * 5;
    }
    // For very large amounts, use an even higher probability
    else {
        return BASE_THRESHOLD * 10;
    }
}
