import { expect } from "chai";
import { ethers, network } from "hardhat";
import { Auction, NFTicket } from "../typechain-types";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";


describe("Auction", () => {

    let provider: JsonRpcProvider;
    let nft: Contract;
    let auction: Contract;
    let contractOwner: SignerWithAddress;
    let nftOwner: SignerWithAddress;
    let tokenId: number;
    let bidder1: SignerWithAddress;
    let bidder2: SignerWithAddress;
    let bidder3: SignerWithAddress;
    beforeEach(async () => {
        [
        contractOwner,
        nftOwner,
        bidder1,
        bidder2,
        bidder3,
        ] = await ethers.getSigners();
        provider = ethers.provider;

        // deploy nft
        const _nft = await ethers.getContractFactory('NFTicket', contractOwner);
        nft = await _nft.deploy();

        await nft.deployed();

        const trx = await nft.safeMint(nftOwner.address, 1);
        const receipt = await trx.wait();
        tokenId = parseInt(receipt.logs[0].topics[3]);

        const _auction = await ethers.getContractFactory('Auction', nftOwner);
        auction = await _auction.deploy(nft.address, tokenId, 0);
    });

    describe('Initial settings', () => {
      it('balance of nft owner', async () => {
        const balance = await nft.balanceOf(nftOwner.address);
        expect(balance).to.equal(1);
      });
    });

    describe('start auction', () => {
        beforeEach(async () => {
            await nft.connect(nftOwner).approve(auction.address, tokenId);
            await auction.connect(nftOwner).start();
        })

      it('start auction', async () => {
        expect(await auction.started()).to.equal(true);
      });

      it('started auction', async () => {
        expect(auction.connect(nftOwner).start()).revertedWith('started');
      });

      it('bid not started', async () => {
          expect(auction.connect(bidder1).bid({value: 100})).revertedWith('not started');
      });
    });

    describe('Auction process', () => {
        beforeEach(async () => {
            await nft.connect(nftOwner).approve(auction.address, tokenId);
            await auction.connect(nftOwner).start();
        });

        it('bid', async () => {
            await auction.connect(bidder1).bid({value: 100});
            expect(await auction.highestBid()).to.equal(100);
        });

        it('bid twice', async () => {
            await auction.connect(bidder1).bid({value: 100});
            expect(auction.connect(bidder1).bid({value: 100})).revertedWith('highest bidder');
        });

        it('not ended auction', async () => {
            await auction.connect(bidder1).bid({value: 100});
            expect(auction.connect(nftOwner).end()).revertedWith('not ended');
        });

        it('end auction', async () => {
            await auction.connect(bidder1).bid({value: '5000000000000000000'});
            await auction.connect(bidder2).bid({value: '10000000000000000000'});
            await auction.connect(bidder3).bid({value: '200000000000000000000'});
            
            let DAYS = 1000 * 60 * 60 * 24 * 7;
            // Time travelling to the future!
            await network.provider.request({
              method: 'evm_increaseTime',
              params: [DAYS],
            });

            await auction.connect(nftOwner).end();
            const balance = await nft.balanceOf(bidder3.address);
            expect(balance).to.equal(1);
            expect(await auction.ended()).to.equal(true);
        });

        it('withdraw', async () => {
            await auction.connect(bidder1).bid({value: '5000000000000000000'});
            await auction.connect(bidder2).bid({value: '10000000000000000000'});
            await auction.connect(bidder3).bid({value: '200000000000000000000'});
            
            let DAYS = 1000 * 60 * 60 * 24 * 7;
            // Time travelling to the future!
            await network.provider.request({
              method: 'evm_increaseTime',
              params: [DAYS],
            });

            await auction.connect(nftOwner).end();
            await auction.connect(bidder3).withdraw();
            expect(await auction.bids(bidder3.address)).to.equal(0);
        });

    });
});
