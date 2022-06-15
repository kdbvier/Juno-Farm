import React, { useState, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import useContract, { contractAddresses } from "../../hook/useContract";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { NFTItemWrapper, StyledButton } from "./styled";

export interface NFTItemProps {
  id: string;
  state?: string;
  callback: any;
  item: any;
  currentTime: number;
  unStakingPeriod?: number;
}

export default function NFTItem({
  id,
  state,
  callback,
  item,
  currentTime,
  unStakingPeriod,
}: NFTItemProps) {
  const [sendingTx, setSendingTx] = useState(false);
  const { runExecute } = useContract();
  const nftContract = useAppSelector(
    (state) => state.accounts.accountList[contractAddresses.NFT_CONTRACT]
  );
  const stakingContract = useAppSelector(
    (state) => state.accounts.accountList[contractAddresses.STAKING_CONTRACT]
  );
  const unStakeTime = useMemo(
    () => (item?.unstake_time ? item.unstake_time * 1000 : currentTime),
    [currentTime, item]
  );

  const passedPeriod = useMemo(
    () => currentTime - unStakeTime,
    [currentTime, unStakeTime]
  );
  const remainTime = useMemo(
    () => unStakeTime + (unStakingPeriod || 0) * 1000 - currentTime,
    [currentTime, unStakeTime, unStakingPeriod]
  );

  const handleClickStakeUnstakeButton = async () => {
    // if (stakeUnstakeDisabled) return;
    if (state === "stake") {
      try {
        setSendingTx(true);
        await runExecute(contractAddresses.NFT_CONTRACT, {
          send_nft: {
            contract: stakingContract.address,
            token_id: id,
            msg: btoa("staking"),
          },
        });
        toast.success("Success");
        callback();
        // fetchNFT();
      } catch (err) {
        console.log("err: ", err);
        toast.error("Fail!");
      } finally {
        setSendingTx(false);
      }
    } else if (state === "unstake") {
      try {
        setSendingTx(true);
        await runExecute(contractAddresses.STAKING_CONTRACT, {
          unstake_nft: {
            token_id: id,
          },
        });
        toast.success("Success");
        callback();
        // fetchNFT();
      } catch (err) {
        console.log("err: ", err);
        toast.error("Fail!");
      } finally {
        setSendingTx(false);
      }
    }
    // else if (nftStatus === NFTItemStatus.UNSTAKED && isPassedPeriod) {
    //   try {
    //     setSendingTx(true);
    //     await runExecute(stakingContract.address, {
    //       withdraw_nft: {
    //         token_id: item.token_id,
    //       },
    //     });
    //     if (fetchNFT) await fetchNFT();
    //     toast.success("Success");
    //     // fetchNFT();
    //   } catch (err) {
    //     console.log("err: ", err);
    //     toast.error("Fail!");
    //   } finally {
    //     setSendingTx(false);
    //   }
    // }
  };
  return (
    <NFTItemWrapper state={state || "stake"}>
      <div>Juno Farming NFT</div>
      <img src="/logo.svg" alt="logo" />
      <div style={{ fontSize: "15px", fontWeight: "800" }}>
        {id.replace("Sunny.", "")}
      </div>
      <StyledButton
        onClick={handleClickStakeUnstakeButton}
        disabled={state === "staking"}
      >
        {state}
      </StyledButton>
    </NFTItemWrapper>
  );
}
