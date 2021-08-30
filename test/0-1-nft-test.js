const { expectRevert, expectEvent } = require('@openzeppelin/test-helpers')
const { web3 } = require('@openzeppelin/test-helpers/src/setup')
const chai = require('chai')
const { solidity } = require('ethereum-waffle')

chai.use(solidity)
const { expect } = require('chai')

let bassTx, accounts, deployer


describe('#InitNFT', () => {

    it('deploy contracts and set variables', async () => {
        accounts = await hre.ethers.getSigners()
        deployer = accounts[0]
        bob = accounts[1]

        const BassTxFact = await ethers.getContractFactory('BassTransaction')
        bassTx = await upgrades.deployProxy(BassTxFact, ['https://ipfs.io/{hash}', deployer.address])
        await bassTx.deployed()

    })

    it('setCreator', async () => {
        await bassTx.register(deployer.address, 'asdin1ndnu0910n', 'metamask', 'sha')
        await bassTx.setCreatorVerified(deployer.address)
        const status = await bassTx.isRegistered(deployer.address)
        expect(status).to.equal(true)
    })
    it('createTrack failed: Ratio error', async () => {
        const TRACK_ID = 1
        const PACKED = await web3.eth.abi.encodeParameters(
            ['uint256', 'address[]', 'uint256[]', 'uint256[]'],
            [
                TRACK_ID,
                [deployer.address],
                [1],
                [1, 21, 100],
            ],
        )
        const PACKED_HASH = await web3.utils.sha3(PACKED)
        const signature = await deployer.signMessage(
            Buffer.from(PACKED_HASH.substr(2), 'hex'),
        )
        const AUTHOR = 'tester'
        const TRACK_NAME = 'track1'
        const TRACK_COPIES = 2000
        const INTRODUCTION = 'A testing track.'
        const DEMO_HASH = 'a72hnd82nasdn912'
        const COVER = 'abc'
        const RELEASE = 1611239125

        await expect(bassTx.createTrack(
            AUTHOR,
            TRACK_NAME,
            TRACK_COPIES,
            INTRODUCTION,
            DEMO_HASH,
            COVER,
            RELEASE,
            PACKED,
            signature,
        )).to.be.reverted

    })

    it('createTrack', async () => {
        const TRACK_ID = 1
        const PACKED = await web3.eth.abi.encodeParameters(
            ['uint256', 'address[]', 'uint256[]', 'uint256[]'],
            [
                TRACK_ID,
                [deployer.address],
                [1],
                [1, 20, 100],
            ],
        )
        const PACKED_HASH = await web3.utils.sha3(PACKED)
        const signature = await deployer.signMessage(
            Buffer.from(PACKED_HASH.substr(2), 'hex'),
        )
        const AUTHOR = 'tester'
        const TRACK_NAME = 'track1'
        const TRACK_COPIES = 2000
        const INTRODUCTION = 'A testing track.'
        const DEMO_HASH = 'a72hnd82nasdn912'
        const COVER = 'abc'
        const RELEASE = 1611239125
        await bassTx.createTrack(
            AUTHOR,
            TRACK_NAME,
            TRACK_COPIES,
            INTRODUCTION,
            DEMO_HASH,
            COVER,
            RELEASE,
            PACKED,
            signature,
        )
        const track = await bassTx.trackInfo(TRACK_ID)
        const sharing = await bassTx.getSharingOf(TRACK_ID)
        expect(track[0]).to.equal(AUTHOR)
        expect(track[1]).to.equal(deployer.address)
        expect(track[2]).to.equal(TRACK_NAME)
        expect(track[3]).to.equal(TRACK_COPIES)
        expect(track[4]).to.equal(0)
        expect(track[5]).to.equal(INTRODUCTION)
        expect(track[6]).to.equal(DEMO_HASH)
        expect(track[7]).to.equal(COVER)
        expect(track[8]).to.equal(RELEASE)
        expect(track[9]).to.equal(1)
        expect(sharing[0][0][0]).to.equal(deployer.address)
        expect(sharing[0][1][0]).to.equal(1)
        expect(sharing[0][2]).to.equal(1)
        expect(sharing[1][0]).to.equal(20)
        expect(sharing[1][1]).to.equal(100)

    })

    //   it('createTrack failed: ID used', async () => {
    //     const TRACK_ID = 1
    //     const PACKED = await web3.eth.abi.encodeParameters(
    //       ['uint256', 'address[]', 'uint256[]', 'uint256[]'],
    //       [
    //         TRACK_ID,
    //         [deployer.address],
    //         [1],
    //         [1, 20, 100],
    //       ],
    //     )
    //     const PACKED_HASH = await web3.utils.sha3(PACKED)
    //     const signature = await deployer.signMessage(
    //       Buffer.from(PACKED_HASH.substr(2), 'hex'),
    //     )
    //     const AUTHOR = 'tester'
    //     const TRACK_NAME = 'track1'
    //     const TRACK_COPIES = 2000
    //     const INTRODUCTION = 'A testing track.'
    //     const DEMO_HASH = 'a72hnd82nasdn912'
    //     const COVER = 'abc'
    //     const RELEASE = 1611239125

    //     await expect(bassTx.createTrack(
    //       AUTHOR,
    //       TRACK_NAME,
    //       TRACK_COPIES,
    //       INTRODUCTION,
    //       DEMO_HASH,
    //       COVER,
    //       RELEASE,
    //       PACKED,
    //       signature,
    //     )).to.be.reverted//, "ID used")

    //   })

    it('createTrack: New version', async () => {
        const TRACK_ID2 = 2

        const AUTHOR = 'tester'
        const TRACK_NAME = 'track1'
        const TRACK_COPIES = 2000
        const INTRODUCTION = 'A testing track.'
        const DEMO_HASH = 'a72hnd82nasdn912'
        const COVER2 = '456'
        const RELEASE2 = 1611239911
        const PACKED2 = await web3.eth.abi.encodeParameters(
            ['uint256', 'address[]', 'uint256[]', 'uint256[]'],
            [
                TRACK_ID2,
                [deployer.address],
                [1],
                [1, 20, 100],
            ],
        )
        const PACKED_HASH2 = await web3.utils.sha3(PACKED2)
        const signature2 = await deployer.signMessage(
            Buffer.from(PACKED_HASH2.substr(2), 'hex'),
        )
        bassTx.createTrack(
            AUTHOR,
            TRACK_NAME,
            TRACK_COPIES,
            INTRODUCTION,
            DEMO_HASH,
            COVER2,
            RELEASE2,
            PACKED2,
            signature2,
        )
        track = await bassTx.trackInfo(TRACK_ID2)
        sharing = await bassTx.getSharingOf(TRACK_ID2)

        expect(track[0]).to.equal(AUTHOR)
        expect(track[1]).to.equal(deployer.address)
        expect(track[2]).to.equal(TRACK_NAME)
        expect(track[3]).to.equal(TRACK_COPIES)
        expect(track[4]).to.equal(0)
        expect(track[5]).to.equal(INTRODUCTION)
        expect(track[6]).to.equal(DEMO_HASH)
        expect(track[7]).to.equal(COVER2)
        expect(track[8]).to.equal(RELEASE2)
        expect(track[9]).to.equal(2)
        expect(sharing[0][0][0]).to.equal(deployer.address)
        expect(sharing[0][1][0]).to.equal(1)
        expect(sharing[0][2]).to.equal(1)
        expect(sharing[1][0]).to.equal(20)
        expect(sharing[1][1]).to.equal(100)

    })

    it('updateSharing', async () => {
        const TRACK_ID = 1
        const PACKED = await web3.eth.abi.encodeParameters(
            ['uint256', 'address[]', 'uint256[]', 'uint256'],
            [
                TRACK_ID,
                [deployer.address, bob.address],
                [10, 1],
                11,
            ],
        )
        const PACKED_HASH = await web3.utils.sha3(PACKED)
        const signature = await deployer.signMessage(
            Buffer.from(PACKED_HASH.substr(2), 'hex'),
        )
        await bassTx.updateTrackSharing(
            PACKED,
            signature,
        )
        const sharing = await bassTx.getSharingOf(TRACK_ID)

        expect(sharing[0][0][0]).to.equal(deployer.address)
        expect(sharing[0][0][1]).to.equal(bob.address)
        expect(sharing[0][1][0]).to.equal(10)
        expect(sharing[0][2]).to.equal(11)
    })

    it('updateSharing failed: Only author', async () => {
        const TRACK_ID = 1
        const PACKED = await web3.eth.abi.encodeParameters(
            ['uint256', 'address[]', 'uint256[]', 'uint256'],
            [TRACK_ID, [deployer.address, bob.address], [10, 1], 11],
        )
        const PACKED_HASH = await web3.utils.sha3(PACKED)
        const signature = await deployer.signMessage(
            Buffer.from(PACKED_HASH.substr(2), 'hex'),
        )

        await expect(bassTx.connect(bob).updateTrackSharing(
            PACKED,
            signature,
        )).to.be.reverted//, "Only author")
    })

    it('updateSharing failed: Sharing data len error', async () => {
        const TRACK_ID = 1
        const PACKED = await web3.eth.abi.encodeParameters(
            ['uint256', 'address[]', 'uint256[]', 'uint256'],
            [TRACK_ID, [deployer.address, bob.address], [10], 10],
        )
        const PACKED_HASH = await web3.utils.sha3(PACKED)
        const signature = await deployer.signMessage(
            Buffer.from(PACKED_HASH.substr(2), 'hex'),
        )

        await expect(bassTx.updateTrackSharing(
            PACKED,
            signature,
        )).to.be.reverted//, "Sharing data len error")
    })

    it('mint', async () => {
        const TRACK_ID = 2
        const expiredTime = Math.round(Number(new Date()) / 1000) + 30 * 60
        const ORIGIN_HASH = await ethers.utils.formatBytes32String('123456')
        const PACKED = await ethers.utils.solidityPack(
            ['uint256', 'uint256', 'bytes32'],
            [1, expiredTime, Buffer.from(ORIGIN_HASH.substr(2), 'hex')],

        )
        const HASH_DATA = await ethers.utils.keccak256(PACKED)
        const FAKE_SIGNATURE = await bob.signMessage(
            Buffer.from(HASH_DATA.substr(2), 'hex'),
        )
        await expect(bassTx.mintFirstEditionTo(TRACK_ID, bob.address, PACKED, FAKE_SIGNATURE)).to.be.reverted//, 'Minting illegal')
        const SIGNATURE = await deployer.signMessage(
            Buffer.from(HASH_DATA.substr(2), 'hex'),
        )
        await bassTx.mintFirstEditionTo(TRACK_ID, deployer.address, PACKED, SIGNATURE)

        const origin = await bassTx.getOriginHashOf(TRACK_ID, 1)
        let track = await bassTx.trackInfo(TRACK_ID)

        expect(origin).to.equal(ORIGIN_HASH)
        expect(track[4]).to.equal(1)


        const ORIGIN_HASH2 = ethers.utils.formatBytes32String('789010')
        const PACKED2 = await ethers.utils.solidityPack(
            ['uint256', 'uint256', 'bytes32'],
            [2, expiredTime, Buffer.from(ORIGIN_HASH2.substr(2), 'hex')],

        )
        const HASH_DATA2 = await ethers.utils.keccak256(PACKED2)
        const SIGNATURE2 = await deployer.signMessage(
            Buffer.from(HASH_DATA2.substr(2), 'hex'),
        )
        await bassTx.mintFirstEditionTo(TRACK_ID, deployer.address, PACKED2, SIGNATURE2)

        const origin2 = await bassTx.getOriginHashOf(TRACK_ID, 2)
        track = await bassTx.trackInfo(TRACK_ID)

        expect(origin2).to.equal(ORIGIN_HASH2)
        expect(track[4]).to.equal(2)

        const balance = await bassTx.balanceOf(deployer.address, TRACK_ID)
        expect(balance).to.equal(2)

    })

    it('transfer failed: Transfer signature illegal', async () => {

        const TRACK_ID = 2
        const INPUT_BYTES = ethers.utils.formatBytes32String('1234')
        const expiredTime = Math.round(Number(new Date()) / 1000) + 30 * 60
        const PACKED = await ethers.utils.solidityPack(
            ['uint256', 'uint256', 'bytes32'],
            [1, expiredTime, Buffer.from(INPUT_BYTES.substr(2), 'hex')],

        )
        const HASH_DATA = await ethers.utils.keccak256(PACKED)
        const SIGNATURE = await bob.signMessage(
            Buffer.from(HASH_DATA.substr(2), 'hex'),
        )

        await expect(
            bassTx.transfer(deployer.address, bob.address, TRACK_ID, 1, PACKED, SIGNATURE),
        ).to.be.reverted//,
        // 'Transfer signature illegal')

    })

    it('transfer failed: Target address is not registered', async () => {

        const TRACK_ID = 2
        const INPUT_BYTES = ethers.utils.formatBytes32String('1234')
        const expiredTime = 0
        const PACKED = await ethers.utils.solidityPack(
            ['uint256', 'uint256', 'bytes32'],
            [1, expiredTime, Buffer.from(INPUT_BYTES.substr(2), 'hex')],

        )
        const HASH_DATA = await ethers.utils.keccak256(PACKED)
        const SIGNATURE = await deployer.signMessage(
            Buffer.from(HASH_DATA.substr(2), 'hex'),
        )

        await expect(
            bassTx.transfer(deployer.address, bob.address, TRACK_ID, 1, PACKED, SIGNATURE),
        ).to.be.reverted//,
        // 'Target address is not registered')


    })

    it('transfer failed: Data expired', async () => {

        const TRACK_ID = 2
        const INPUT_BYTES = ethers.utils.formatBytes32String('1234')
        const expiredTime = Math.round(Number(new Date()) / 1000) - 30 * 60
        const PACKED = await ethers.utils.solidityPack(
            ['uint256', 'uint256', 'bytes32'],
            [1, expiredTime, Buffer.from(INPUT_BYTES.substr(2), 'hex')],

        )
        const HASH_DATA = await ethers.utils.keccak256(PACKED)
        const SIGNATURE = await deployer.signMessage(
            Buffer.from(HASH_DATA.substr(2), 'hex'),
        )

        await bassTx.register(bob.address, 'asdin1ndnu0910n', 'metamask', 'sha')
        await expect(
            bassTx.transfer(deployer.address, bob.address, TRACK_ID, 1, PACKED, SIGNATURE),
        ).to.be.reverted//,
        // 'Data expired')

    })

    it('transfer', async () => {

        const TRACK_ID = 2
        const INPUT_BYTES = ethers.utils.formatBytes32String('1234')
        const expiredTime = Math.round(Number(new Date()) / 1000) + 30 * 60
        const PACKED = await ethers.utils.solidityPack(
            ['uint256', 'uint256', 'bytes32'],
            [1, expiredTime, Buffer.from(INPUT_BYTES.substr(2), 'hex')],

        )
        const HASH_DATA = await ethers.utils.keccak256(PACKED)
        const SIGNATURE = await deployer.signMessage(
            Buffer.from(HASH_DATA.substr(2), 'hex'),
        )
        const commons = await bassTx.getCommonIdOf(deployer.address, TRACK_ID)
        expect(commons[0]).to.equal(1)

        await bassTx.transfer(deployer.address, bob.address, TRACK_ID, 1, PACKED, SIGNATURE)

        const bobs_commons = await bassTx.getCommonIdOf(bob.address, TRACK_ID)
        const deployers_commons = await bassTx.getCommonIdOf(deployer.address, TRACK_ID)

        expect(bobs_commons[0]).to.equal(1)
        expect(deployers_commons[0]).to.equal(2)

        const hash = await bassTx.getOriginHashOf(2, 1)
        expect(hash).to.equal(INPUT_BYTES)
    })

    it('Batch mint', async () => {
        const TRACK_ID = [1, 2]

        const expiredTime = Math.round(Number(new Date()) / 1000) + 30 * 60
        const ORIGIN_HASH = [
            await ethers.utils.formatBytes32String('123456'),
            await ethers.utils.formatBytes32String('789010'),
        ]
        const ORIGIN_BYTES = []
        for (let i = 0; i < ORIGIN_HASH.length; i++) {
            ORIGIN_BYTES.push(Buffer.from(ORIGIN_HASH[i].substr(2), 'hex'))
        }
        const PACKED = await web3.eth.abi.encodeParameters(
            ['uint256[]', 'uint256', 'bytes32[]'],
            [[10, 20], expiredTime, ORIGIN_BYTES],
        )

        const HASH_DATA = await ethers.utils.keccak256(PACKED)

        const SIGNATURE = await deployer.signMessage(
            Buffer.from(HASH_DATA.substr(2), 'hex'),
        )
        await bassTx.mintBlindBox(TRACK_ID, [1, 1], deployer.address, PACKED, SIGNATURE)

        const origin = await bassTx.getOriginHashOf(TRACK_ID[0], 10)
        const origin2 = await bassTx.getOriginHashOf(TRACK_ID[1], 20)
        const track = await bassTx.trackInfo(TRACK_ID[0])
        const track2 = await bassTx.trackInfo(TRACK_ID[1])

        expect(origin).to.equal(ORIGIN_HASH[0])
        expect(origin2).to.equal(ORIGIN_HASH[1])
        expect(track[4]).to.equal(1)
        expect(track2[4]).to.equal(3)


        const balance = await bassTx.balanceOf(deployer.address, TRACK_ID[0])
        const balance2 = await bassTx.balanceOf(deployer.address, TRACK_ID[1])
        expect(balance).to.equal(1)
        expect(balance2).to.equal(2)

    })
})
