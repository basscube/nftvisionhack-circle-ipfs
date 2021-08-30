pragma solidity ^0.7.6;
pragma experimental ABIEncoderV2;

import "./BassNFT.sol";
import "./lib/EcdsaVerify.sol";

// SPDX-License-Identifier: UNLICENSED
contract BassTransaction is BassNFT, EcdsaVerify {
    function initialize(string memory ipfsURL, address verifierAddr)
        public
        initializer
    {
        __Ownable_init();
        userId = 0;
        __ERC1155_init(ipfsURL);
        verifier = verifierAddr;
    }

    function createTrack(
        string memory authorName,
        string memory nameOfTrack,
        uint256 copiesOfTrack,
        string memory introductionOfTrack,
        string memory demoHashOfTrack,
        string memory coverOfTrack,
        uint256 releaseTimeOfTrack,
        bytes memory data,
        bytes memory signature
    ) public {
        bytes32 authData = keccak256(data);
        // require(
        //     dataAuthentication(authData, signature, verifier),
        //     "Data authentication failed"
        // );
        (
            uint256 trackId,
            address[] memory _sharingAddr,
            uint256[] memory _sharingRatio,
            uint256[] memory _sharingUint
        ) = abi.decode(
                data,
                (uint256, address[], uint256[], uint256[])
            );
        _createTrack(
            trackId,
            authorName,
            nameOfTrack,
            copiesOfTrack,
            introductionOfTrack,
            demoHashOfTrack,
            coverOfTrack,
            releaseTimeOfTrack
        );
        _writeTrackRoyalty(trackId, _sharingUint[1], _sharingUint[2]);
        _writeTrackSharing(trackId, _sharingAddr, _sharingRatio, _sharingUint[0]);
    }

    function updateTrackSharing(bytes memory data, bytes memory signature)
        public
    {
        bytes32 authData = keccak256(data);
        require(
            dataAuthentication(authData, signature, verifier),
            "Data authentication failed"
        );
        (
            uint256 trackId,
            address[] memory _sharingAddr,
            uint256[] memory _sharingRatio,
            uint256 _sharingDeno
        ) = abi.decode(data, (uint256, address[], uint256[], uint256));
        _writeTrackSharing(trackId, _sharingAddr, _sharingRatio, _sharingDeno);
    }

    function mintFirstEditionTo(
        uint256 trackId,
        address to,
        bytes memory data,
        bytes memory signature
    ) public {
        bytes32 authData = keccak256(data);
        // require(
        //     dataAuthentication(authData, signature, verifier),
        //     "Minting illegal"
        // );

        _mint(to, trackId, 1, data);
    }

    function mintBlindBox(
        uint256[] memory trackIds,
        uint256[] memory amounts,
        address to,
        bytes memory data,
        bytes memory signature
    ) public {
        bytes32 authData = keccak256(data);
        require(
            dataAuthentication(authData, signature, verifier),
            "Minting illegal"
        );

        _mintBatch(to, trackIds, amounts, data);
    }

    function transfer(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data,
        bytes memory signature
    ) public {
        bytes32 authData = keccak256(data);
        // require(
        //     dataAuthentication(authData, signature, verifier),
        //     "Transfer signature illegal"
        // );

        _safeTransferFrom(from, to, id, amount, data);
    }

    function getTracksOfAuthor(address author)
        public
        view
        virtual
        returns (TrackInfo[] memory)
    {
        return tracksOfAuthor[author];
    }
}
