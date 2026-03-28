pragma circom 2.1.0;

include "../../node_modules/circomlib/circuits/poseidon.circom";
include "../../node_modules/circomlib/circuits/comparators.circom";

/**
 * MorphYield Lease Proof
 * Proves:
 * 1. User has a balance >= required amount (threshold)
 * 2. The lease duration is within protocol limits
 * 3. Metadata integrity via commitment
 */
template LeaseProof() {
    // Public inputs
    signal input balanceThreshold;
    signal input minDuration;
    signal input metadataCommitment; // Hash of original NFT state

    // Private inputs
    signal input userBalance;
    signal input requestedDuration;
    signal input currentMetadataHash;
    signal input salt;

    // 1. Verify Balance >= Threshold
    component gteBalance = GreaterEqThan(252);
    gteBalance.in[0] <== userBalance;
    gteBalance.in[1] <== balanceThreshold;
    gteBalance.out === 1;

    // 2. Verify Duration >= Min Duration
    component gteDuration = GreaterEqThan(252);
    gteDuration.in[0] <== requestedDuration;
    gteDuration.in[1] <== minDuration;
    gteDuration.out === 1;

    // 3. Verify Metadata Integrity
    // We hash the current metadata with a salt to match the commitment
    component hasher = Poseidon(2);
    hasher.inputs[0] <== currentMetadataHash;
    hasher.inputs[1] <== salt;
    
    hasher.out === metadataCommitment;
}

component main {public [balanceThreshold, minDuration, metadataCommitment]} = LeaseProof();