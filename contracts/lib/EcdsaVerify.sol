pragma solidity 0.7.6;

import "@openzeppelin/contracts/cryptography/ECDSA.sol";

/**
 * @title EcdsaVerify
 * @author Bass Protocol Developers
 */
contract EcdsaVerify {
    using ECDSA for bytes32;

    function dataAuthentication(bytes32 data, bytes memory signature, address verifier)
        public
        pure
        returns (bool)
    {
        /* (d): Account-only authentication: ECDSA-signed by verifier. */
        bytes32 calculateHash = data.toEthSignedMessageHash();
        if (
            calculateHash.recover(signature) == verifier
        ) {
            return true;
        }
        return false;
    }
}