const snarkjs = require("snarkjs");
const path = require("path");
const fs = require("fs");

/**
 * Generates a ZK-proof for a lease.
 * Note: In a production self-sovereign ZK system, the user generates the proof.
 * This relayer service accepts the proof and public signals to submit the transaction.
 * This helper is used for server-side verification or automated testing.
 */
async function generateLeaseProof(publicInputs) {
    const wasmPath = path.join(__dirname, "../../build/circuits/lease_proof_js/lease_proof.wasm");
    const zkeyPath = path.join(__dirname, "../../build/circuits/lease_proof_final.zkey");

    if (!fs.existsSync(wasmPath) || !fs.existsSync(zkeyPath)) {
        throw new Error(`Circuit artifacts missing at ${wasmPath} or ${zkeyPath}. Run circuit build first.`);
    }

    try {
        // publicInputs should contain: nftId, uTokenAmount, duration, etc.
        // The 'secret' (witness) must be provided by the client or generated from client-side data.
        // For the MVP relayer, we assume the client sends the full proof, 
        // but we provide this utility for internal protocol actions.
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            publicInputs,
            wasmPath,
            zkeyPath
        );

        return {
            proof,
            publicSignals
        };
    } catch (error) {
        console.error("Failed to generate ZK proof:", error);
        throw new Error("ZK_PROOF_GENERATION_FAILED");
    }
}

/**
 * Formats snarkjs proof for Solidity verifier input
 */
function formatForVerifier(proof, publicSignals) {
    return {
        a: [proof.pi_a[0], proof.pi_a[1]],
        b: [
            [proof.pi_b[0][1], proof.pi_b[0][0]],
            [proof.pi_b[1][1], proof.pi_b[1][0]]
        ],
        c: [proof.pi_c[0], proof.pi_c[1]],
        input: publicSignals
    };
}

module.exports = {
    generateLeaseProof,
    formatForVerifier
};