pragma circom 2.1.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";

/**
 * MorphYield State Integrity Circuit
 * Proves:
 * 1. currentMetadataHash matches the original commitment made at deposit.
 * 2. userBalance >= requiredBalance.
 * 3. currentTime - startTime >= requiredDuration.
 */
template StateIntegrity() {
    // Public Inputs
    signal input originalCommitment; // Hash(originalMetadata, salt)
    signal input requiredBalance;
    signal input requiredDuration;
    signal input currentTime;

    // Private Inputs
    signal input currentMetadata;
    signal input salt;
    signal input userBalance;
    signal input startTime;

    // 1. Verify Metadata Integrity
    // We hash the current metadata with the secret salt to see if it matches the original commitment
    component metadataHasher = Poseidon(2);
    metadataHasher.inputs[0] <== currentMetadata;
    metadataHasher.inputs[1] <== salt;
    
    metadataHasher.out === originalCommitment;

    // 2. Verify Token Balance
    // userBalance >= requiredBalance
    component balanceCheck = GreaterEqThan(252);
    balanceCheck.in[0] <== userBalance;
    balanceCheck.in[1] <== requiredBalance;
    balanceCheck.out === 1;

    // 3. Verify Time Window / Duration
    // currentTime must be greater than startTime
    component timeOrder = GreaterThan(252);
    timeOrder.in[0] <== currentTime;
    timeOrder.in[1] <== startTime;
    timeOrder.out === 1;

    // actualDuration = currentTime - startTime
    signal actualDuration <== currentTime - startTime;

    // actualDuration >= requiredDuration
    component durationCheck = GreaterEqThan(252);
    durationCheck.in[0] <== actualDuration;
    durationCheck.in[1] <== requiredDuration;
    durationCheck.out === 1;
}

component main {public [originalCommitment, requiredBalance, requiredDuration, currentTime]} = StateIntegrity();