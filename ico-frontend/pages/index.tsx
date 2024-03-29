import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance, useContractWrite } from 'wagmi'
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

import SPCABI from "../artifacts/SpaceCoinICOABI.json";
import { ethers } from 'ethers';

const SPACE_COIN_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const Home: NextPage = () => {
  const { data } = useAccount()
  const { data: balanceData, isError, isLoading } = useBalance({
    addressOrName: SPACE_COIN_ADDRESS,
    // TODO: Using UNI addressfor now due to deployment issues
    token: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
  })

  const [amount, setAmount] = useState(0);

  if (isLoading) return <div>Fetching balance…</div>
  if (isError) return <div>Error fetching balance</div>

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { data: investData , isError: isInvestError, isLoading: isInvestLoading, write } = useContractWrite(
    {
      addressOrName: '0xecb504d39723b0be0e3a9aa33d646642d1051ee1',
      contractInterface: SPCABI,
    },
    'invest',
    {
      args: [
        {value: ethers.utils.parseEther(amount.toString())},
      ]
    }
  )

  if (isInvestLoading) return <div>Investing amount...</div>
  if (isInvestError) return <div>Error investing amount</div>

  const displayBalance = balanceData?.formatted + " " + balanceData?.symbol || "N/A";


const handleChange = (e) => setAmount(e.target.value);

  return (
    <div className={styles.container}>
      <Head>
        <title>Space Coin ICO</title>
        <meta
          name="description"
          content="Generated by @rainbow-me/create-rainbowkit"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <ConnectButton />

        <h1 className={styles.title}>
         Space Coin ICO
        </h1>

        <p>Connected Address: {data?.address}</p>
        <p>Balance: {displayBalance}</p>

    
        <div className={styles.grid}>
          <input type="text" onChange={handleChange}/>
          <button onClick={() => write()}>Send</button>
        </div>
      </main>


    </div>
  );
};

export default Home;
