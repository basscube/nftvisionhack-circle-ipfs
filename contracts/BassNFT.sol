pragma solidity ^0.7.6;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";

// SPDX-License-Identifier: UNLICENSED
contract BassNFT is ERC1155Upgradeable, OwnableUpgradeable {
    using SafeMath for uint256;
    using Address for address;
    uint256 userId;
    address public verifier;

    struct UserInfo {
        string publicKey; // encryption public key
        string walletType; // wallet type (metamask)
        string encryptType; // encrypt type
        bool isCreator; // check if user is a creator
    }

    struct TrackInfo {
        string authorName; // author of track
        address authorAddr; // addr of author
        string name; // track name
        uint256 copies; // amount of max copies
        uint256 mintedCopies; // amount of minted copies
        string introduction; // introduction of track
        string demoHash; // hash of demo url
        string cover; // cover of NFT
        uint256 releaseTime; // first release time
        uint256 version; // ver. of NFT
        uint256 id;
    }

    struct TrackRoyalty {
        uint256 royaltyRatio;
        uint256 royaltyDenominator;
    }

    struct TrackSharing {
        address[] sharingAddresses;
        uint256[] sharingRatio;
        uint256 sharingDenominator;
    }

    mapping(bytes32 => uint256) tracksOfHash;
    mapping(uint256 => bytes32) private _hashOfTrack;

    mapping(address => uint256) userToId;
    mapping(uint256 => address) idToAddr;

    mapping(address => UserInfo) public userInfo;

    mapping(address => TrackInfo[]) internal tracksOfAuthor;
    mapping(uint256 => TrackInfo) public trackInfo;
    mapping(uint256 => TrackSharing) private trackSharing;
    mapping(uint256 => mapping(uint256 => bytes32)) private _originData;
    mapping(uint256 => mapping(address => uint256)) private _balances;

    mapping(uint256 => mapping(uint256 => address)) private _ownerOfCommonId;
    mapping(uint256 => mapping(address => uint256[]))
        private _trackCommonIdOfOwner;
    mapping(uint256 => TrackRoyalty) private _trackRoyalty;

    uint256 public totalTracks;

    mapping(address => uint256[]) private _collectiblesOf;

    event TrackCreated(address creator, uint256 trackId, uint256 version);

    function balanceOf(address account, uint256 id)
        public
        view
        virtual
        override
        returns (uint256)
    {
        require(
            account != address(0),
            "ERC1155: balance query for the zero address"
        );
        return _balances[id][account];
    }

    function _createTrack(
        uint256 trackId,
        string memory authorName,
        string memory nameOfTrack,
        uint256 copiesOfTrack,
        string memory introductionOfTrack,
        string memory demoHashOfTrack,
        string memory coverOfTrack,
        uint256 releaseTimeOfTrack
    ) internal {
        bytes32 trackHash;
        require(userInfo[msg.sender].isCreator == true, "User not quilified");

        trackId = totalTracks.add(1);
        totalTracks = trackId;
        require(_hashOfTrack[trackId] == bytes32(0), "ID used");

        // use trackHash as unique identivity of track
        // if trackHash is existed then update version number
        trackHash = keccak256(
            abi.encodePacked(msg.sender, authorName, nameOfTrack)
        );
        _hashOfTrack[trackId] = trackHash;

        TrackInfo storage track = trackInfo[trackId];
        track.id = trackId;
        track.authorName = authorName;
        track.authorAddr = msg.sender;
        track.name = nameOfTrack;
        track.copies = copiesOfTrack;
        track.introduction = introductionOfTrack;
        track.demoHash = demoHashOfTrack;
        track.releaseTime = releaseTimeOfTrack;
        track.cover = coverOfTrack;
        track.version = tracksOfHash[trackHash].add(1);

        tracksOfAuthor[msg.sender].push(track);
        tracksOfHash[trackHash] = track.version;

        emit TrackCreated(msg.sender, trackId, track.version);
    }

    function _writeTrackSharing(
        uint256 trackId,
        address[] memory sharingAddresses,
        uint256[] memory sharingRatio,
        uint256 sharingDenominator
    ) internal {
        require(
            sharingAddresses.length == sharingRatio.length,
            "Sharing data len error"
        );
        require(trackInfo[trackId].authorAddr == msg.sender, "Only author");
        TrackSharing storage sharing = trackSharing[trackId];
        sharing.sharingAddresses = sharingAddresses;
        sharing.sharingRatio = sharingRatio;
        sharing.sharingDenominator = sharingDenominator;
    }

    function _writeTrackRoyalty(
        uint256 trackId,
        uint256 ratio,
        uint256 denominator
    ) internal {
        require(
            ratio <= denominator && denominator.div(ratio) >= 5,
            "Ratio error"
        );
        require(trackInfo[trackId].authorAddr == msg.sender, "Only author");
        TrackRoyalty storage royalty = _trackRoyalty[trackId];
        royalty.royaltyDenominator = denominator;
        royalty.royaltyRatio = ratio;
    }

    function _doSafeTransferAcceptanceChecks(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) private {
        if (to.isContract()) {
            try
                IERC1155ReceiverUpgradeable(to).onERC1155Received(
                    operator,
                    from,
                    id,
                    amount,
                    data
                )
            returns (bytes4 response) {
                if (
                    response !=
                    IERC1155ReceiverUpgradeable(to).onERC1155Received.selector
                ) {
                    revert("ERC1155: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1155: transfer to non ERC1155Receiver implementer");
            }
        }
    }

    function _doSafeBatchTransferAcceptanceChecks(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) private {
        if (to.isContract()) {
            try
                IERC1155ReceiverUpgradeable(to).onERC1155BatchReceived(
                    operator,
                    from,
                    ids,
                    amounts,
                    data
                )
            returns (bytes4 response) {
                if (
                    response !=
                    IERC1155ReceiverUpgradeable(to)
                        .onERC1155BatchReceived
                        .selector
                ) {
                    revert("ERC1155: ERC1155Receiver rejected tokens");
                }
            } catch Error(string memory reason) {
                revert(reason);
            } catch {
                revert("ERC1155: transfer to non ERC1155Receiver implementer");
            }
        }
    }

    function _addCollectionTo(address to, uint256 trackId) internal {
        bool isExist;
        for (uint256 i; i < _collectiblesOf[to].length; i++) {
            if (_collectiblesOf[to][i] == trackId) {
                isExist = true;
                break;
            }
        }
        if (!isExist) {
            _collectiblesOf[to].push(trackId);
        }
    }

    function _updateCollectibleOfUser(
        address from,
        address to,
        uint256 trackId,
        uint256 commonId
    ) internal {
        bool listUpdated;
        // Manage owner list of trackCommonIds
        for (uint256 i; i < _trackCommonIdOfOwner[trackId][from].length; i++) {
            if (_trackCommonIdOfOwner[trackId][from][i] == commonId) {
                _trackCommonIdOfOwner[trackId][from][i] = _trackCommonIdOfOwner[
                    trackId
                ][from][_trackCommonIdOfOwner[trackId][from].length - 1];
                _trackCommonIdOfOwner[trackId][from].pop();
                _trackCommonIdOfOwner[trackId][to].push(commonId);
                listUpdated = true;
                break;
            }
        }
        require(listUpdated, "CommonId not founded");
        // Remove collectible record if user don't have
        if (_trackCommonIdOfOwner[trackId][from].length == 0) {
            for (uint256 i; i < _collectiblesOf[from].length; i++) {
                if (_collectiblesOf[from][i] == trackId) {
                    _collectiblesOf[from][i] = _collectiblesOf[from][
                        _collectiblesOf[from].length - 1
                    ];
                    _collectiblesOf[from].pop();
                    break;
                }
            }
        }
    }
    function _mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal override {
        require(account != address(0), "ERC1155: mint to the zero address");
        require(isRegistered(account), "Not registered address");
        TrackInfo storage track = trackInfo[id];
        require(
            isApprovedForAll(track.authorAddr, msg.sender) ||
                msg.sender == track.authorAddr,
            "Approve first or mint by author"
        );
        require(track.mintedCopies < track.copies, "Out of copies");
        require(track.releaseTime < block.timestamp, "Not yet started");
        address operator = _msgSender();
        (uint256 commonId, uint256 ts) = abi.decode(data, (uint256, uint256));
        commonId = track.mintedCopies.add(1);
        require(ts > block.timestamp, "Data expired");
        _beforeTokenTransfer(operator, address(0), account, id, commonId, data);
        _balances[id][account] = _balances[id][account].add(amount);
        _trackCommonIdOfOwner[id][account].push(commonId);
        track.mintedCopies = track.mintedCopies.add(1);
        emit TransferSingle(operator, address(0), account, id, amount);

        _doSafeTransferAcceptanceChecks(
            operator,
            address(0),
            account,
            id,
            amount,
            data
        );
    }

    function _mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory batchData
    ) internal override {
        require(to != address(0), "ERC1155: mint to the zero address");
        require(
            ids.length == amounts.length,
            "ERC1155: ids and amounts length mismatch"
        );

        address operator = _msgSender();
        (uint256[] memory commonIds, uint256 ts) = abi.decode(
            batchData,
            (uint256[], uint256)
        );
        require(ts > block.timestamp, "Data expired");
        for (uint256 i = 0; i < ids.length; i++) {
            TrackInfo storage track = trackInfo[ids[i]];
            require(
                isApprovedForAll(track.authorAddr, msg.sender) ||
                    msg.sender == track.authorAddr,
                "Approve first or mint by author"
            );
            require(track.mintedCopies < track.copies, "Out of copies");
            require(track.releaseTime < block.timestamp, "Not yet started");
            _balances[ids[i]][to] = amounts[i].add(_balances[ids[i]][to]);
            _trackCommonIdOfOwner[ids[i]][to].push(commonIds[i]);
            track.mintedCopies = track.mintedCopies.add(1);
        }

        _beforeBatchTokenTransfer(
            operator,
            address(0),
            to,
            ids,
            amounts,
            batchData
        );

        emit TransferBatch(operator, address(0), to, ids, amounts);

        _doSafeBatchTransferAcceptanceChecks(
            operator,
            address(0),
            to,
            ids,
            amounts,
            batchData
        );
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal {
        require(operator != address(0));
        require(
            isRegistered(to) == true,
            "Not Basscube member, plz register first!"
        );
        if (from != address(0)) {
            require(
                isRegistered(to) == true,
                "Not Basscube member, plz register first!"
            );
        }

        _addCollectionTo(to, id);
        (uint256 commonId, uint256 ts, bytes32 origin) = abi.decode(
            data,
            (uint256, uint256, bytes32)
        );
        _ownerOfCommonId[id][amount] = to;
        _originData[id][amount] = origin;
    }

    function _beforeBatchTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal {
        require(operator != address(0));
        require(
            ids.length == amounts.length,
            "ERC1155: ids and amounts length mismatch"
        );
        require(
            isRegistered(to) == true,
            "Not Basscube member, plz register first!"
        );
        if (from != address(0)) {
            require(
                isRegistered(to) == true,
                "Not Basscube member, plz register first!"
            );
        }

        (
            uint256[] memory commonIds,
            uint256 ts,
            bytes32[] memory originDatas
        ) = abi.decode(data, (uint256[], uint256, bytes32[]));
        require(
            commonIds.length == originDatas.length,
            "ERC1155: common ids and origin length mismatch"
        );
        for (uint256 i = 0; i < ids.length; i++) {
            _ownerOfCommonId[ids[i]][commonIds[i]] = to;
            _originData[ids[i]][commonIds[i]] = originDatas[i];
        }
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public override onlyOwner {}

    function _safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) internal {
        require(to != address(0), "ERC1155: transfer to the zero address");
        require(isRegistered(to), "Target address is not registered");
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ERC1155: caller is not owner nor approved"
        );

        address operator = _msgSender();
        (uint256 commonId, uint256 ts, bytes32 origin) = abi.decode(
            data,
            (uint256, uint256, bytes32)
        );
        require(
            _ownerOfCommonId[id][commonId] == from,
            "Basscube: from isn't NFT owner"
        );
        require(ts > block.timestamp, "Data expired");
        _beforeTokenTransfer(operator, from, to, id, amount, data);

        _balances[id][from] = _balances[id][from].sub(
            1,
            "ERC1155: insufficient balance for transfer"
        );
        _balances[id][to] = _balances[id][to].add(1);
        
        _updateCollectibleOfUser(from, to, id, commonId);

        emit TransferSingle(operator, from, to, id, amount);

        _doSafeTransferAcceptanceChecks(operator, from, to, id, amount, data);
    }

    function getCommonIdOf(address owner, uint256 trackId)
        public
        view
        returns (uint256[] memory)
    {
        return _trackCommonIdOfOwner[trackId][owner];
    }

    function getOriginHashOf(uint256 trackId, uint256 id)
        public
        view
        returns (bytes32)
    {
        return _originData[trackId][id];
    }

    function getSharingOf(uint256 trackId)
        public
        view
        returns (TrackSharing memory, TrackRoyalty memory)
    {
        return (trackSharing[trackId], _trackRoyalty[trackId]);
    }

    function getCollectiblesOf(address owner)
        public
        view
        returns (uint256[] memory)
    {
        return _collectiblesOf[owner];
    }

    function register(
        address registeredAddress,
        string memory _publicKey,
        string memory _walletType,
        string memory _encryptType // onlyOwner
    ) public {
        require(registeredAddress != address(0), "Can't register 0 address");
        userId++;
        idToAddr[userId] = registeredAddress;
        userToId[registeredAddress] = userId;

        userInfo[registeredAddress] = UserInfo({
            publicKey: _publicKey,
            walletType: _walletType,
            encryptType: _encryptType,
            isCreator: true
        });
    }

    function setCreatorVerified(address creator) public onlyOwner {
        require(isRegistered(creator), "creator is not registered");
        UserInfo storage user = userInfo[creator];
        user.isCreator = true;
    }

    function isRegistered(address addr) public view returns (bool) {
        if (userToId[addr] != 0) {
            return true;
        } else {
            return false;
        }
    }
}
