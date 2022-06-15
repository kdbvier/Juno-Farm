import React, { useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import useWindowSize from "../../hook/useWindowSize";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import useContract, { contractAddresses } from "../../hook/useContract";
import { execute, prettifyInput } from "../../features/console/consoleSlice";

import NFTItem from "../../components/NFTItem";
import {
  Wrapper,
  StyledButton,
  Flex,
  SubArea,
  Container,
  ButtonArea,
  ButtonWrapper,
  GetRewardArea,
  Input,
} from "./styled";
import { selectContract } from "../../features/accounts/accountsSlice";
import { useKeplr } from "../../features/accounts/useKeplr";

const revealNftsList = [
  { id: 0, state: "stake" },
  { id: 1, state: "unstake" },
  { id: 2, state: "staking" },
];

const Main: React.FC = () => {
  const dispatch = useAppDispatch();
  const { runQuery, runExecute } = useContract();
  const [loading, setLoading] = React.useState(false);
  const [price, setPrice] = React.useState("");
  const [mintedNfts, setMintedNfts] = React.useState(0);
  const [maxNfts, setMaxNfts] = React.useState(0);
  const [checkMintArray, setCheckMintArray] = React.useState([]);
  const [ownedNFTs, setOwnedNFTs] = React.useState([]);
  const [currentTime, setCurrentTime] = React.useState(Number(new Date()));
  const [unStakingPeriod, setUnstakingPeriod] = React.useState(0);
  const [rewardAddress, setRewardAddress] = React.useState("");
  const { isMobile } = useWindowSize(1000);
  const [owner, setOwner] = React.useState("");
  const [balance, setBalance] = React.useState(0);
  const output = useAppSelector((state) => state.console.output);
  const account = useAppSelector((state) => state.accounts.keplrAccount);

  const mintContract = useAppSelector(
    (state) => state.accounts.accountList[contractAddresses.MINT_CONTRACT]
  );
  const nftContract = useAppSelector(
    (state) => state.accounts.accountList[contractAddresses.NFT_CONTRACT]
  );
  const stakingContract = useAppSelector(
    (state) => state.accounts.accountList[contractAddresses.STAKING_CONTRACT]
  );
  const { connect } = useKeplr();
  const fetchState = async () => {
    if (!account || !mintContract) return;
    const mintResult = await runQuery(mintContract, {
      get_state_info: {},
    });
    console.log("mintState: ", mintResult);
    setMaxNfts(Number(mintResult.total_nft));
    setMintedNfts(Number(mintResult.count));
    setCheckMintArray(mintResult.check_mint);
    setPrice((Number(mintResult.price) / 1000000).toString());
    const currentTime = await runQuery(stakingContract, {
      get_current_time: {},
    });
    setCurrentTime(currentTime ? currentTime * 1000 : Number(new Date()));
  };
  const fetchNFT = async () => {
    if (!account || !nftContract) return;
    const tokens = await runQuery(nftContract, {
      tokens: {
        owner: account.address,
        start_after: undefined,
        limit: undefined,
      },
    });
    const genTokens = tokens.tokens.map((doc: string) => {
      return { id: doc, state: "stake", itme: {} };
    });
    const stakedTokens = await runQuery(stakingContract, {
      get_my_info: {
        address: account.address,
      },
    });
    const genStakedTokens = stakedTokens.map((doc: any) => {
      return { id: doc.token_id, state: "unstake", item: doc };
    });
    console.log("genStakedTokens: ", tokens);
    setOwnedNFTs(genTokens.concat(genStakedTokens));
    const stakingStateInfo = await runQuery(stakingContract, {
      get_state_info: {},
    });
    console.log("stakingstateInfo: ", stakingStateInfo);
    setRewardAddress(stakingStateInfo?.reward_wallet || "");
    setUnstakingPeriod(stakingStateInfo?.staking_period || 0);
  };
  useEffect(() => {
    setInterval(() => {
      fetchState();
      // connect();
    }, 3000);

    return clearInterval();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchNFT();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const mint = async () => {
    console.log("here");
    if (!mintContract) {
      toast.error("Mint contract not found!");
      return;
    }
    console.log(maxNfts, mintedNfts);
    if (maxNfts <= mintedNfts) {
      toast.error("All nfts are minted!");
      return;
    }
    let mintIndexArray: number[] = [];
    checkMintArray.forEach((item: boolean, index: number) => {
      if (item) mintIndexArray.push(index);
    });
    const selectedIndex = mintIndexArray.sort(() => 0.5 - Math.random()).pop();
    const message = {
      mint: { rand: `${(selectedIndex || 0) + 1}` },
    };
    console.log("message", message);
    try {
      await runExecute(mintContract.address, message, {
        funds: price,
      });
      toast.success("Success!");
    } catch (err) {
      console.error(err);
      toast.error("Fail!");
    }
  };
  const callback = () => {
    console.log("staking button clicked");
    fetchNFT();
  };
  console.log("nfts: ", ownedNFTs);
  return (
    <Container>
      <SubArea>
        <Wrapper>
          {ownedNFTs.map((nftItem: any, nftIndex) => (
            <NFTItem
              key={nftIndex}
              id={nftItem.id}
              state={nftItem.state}
              item={nftItem.item}
              currentTime={currentTime}
              callback={callback}
              unStakingPeriod={unStakingPeriod}
            />
          ))}
        </Wrapper>
      </SubArea>
      <GetRewardArea>
        <Input />
        <StyledButton>Distribute</StyledButton>
      </GetRewardArea>
      <ButtonArea>
        <Flex style={{ justifyContent: "space-between" }}>
          <ButtonWrapper>
            <div>1 Mint = 8 Juno (max 20)</div>
            <StyledButton onClick={mint}>Mint</StyledButton>
            <div
              style={{ fontSize: "25px", fontWeight: "800" }}
            >{`${mintedNfts}/${maxNfts}`}</div>
          </ButtonWrapper>
          <ButtonWrapper>
            <div>Claim Rewards</div>
            <StyledButton>Claim</StyledButton>
            <div>&nbsp;</div>
          </ButtonWrapper>
          <ButtonWrapper>
            <div>Unstake Period 21 Days</div>
            <StyledButton>Stake</StyledButton>
            <div style={{ fontSize: "25px", fontWeight: "800" }}>1/3</div>
          </ButtonWrapper>
        </Flex>
      </ButtonArea>
    </Container>
  );
};

export default Main;
