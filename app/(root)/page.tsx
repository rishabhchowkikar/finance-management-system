import HeaderBox from "@/components/HeaderBox";
import RightSidebar from "@/components/RightSidebar";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import React from "react";

const Home = async () => {
  const loggedIn = await getLoggedInUser();

  console.log(loggedIn)

  if (!loggedIn) redirect("/sign-in")

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox type="greeting" title="Welcome" user={loggedIn?.name || "Guest"} subtext="Access and Manage your account and Transactions Efficiently." />
          <TotalBalanceBox
            accounts={[]}
            totalBanks={1}
            totalCurrentBalance={3616}
          />
        </header>

        RECENT TRANSACTIONS

      </div>
      <RightSidebar
        user={loggedIn}
        transactions={[]}
        banks={[{ currentBalance: 211.50 }, { currentBalance: 585.70 }]}
      />
    </section>
  );
};

export default Home;
