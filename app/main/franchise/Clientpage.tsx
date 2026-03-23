import React from 'react'
import HeroBanner from './components/HeroBanner'
import TheOpportunity from './components/TheOpportunity'
import OurAdvantage from './components/OurAdvantage'
import ScalableInvestmentTiers from './components/Investment'
import WeBuildSuccessTogether from './components/WeBuildSuccess'
import WhoWeAre from './components/WhoWeAre'

const Clientpage = () => {
  return (
    <div>
      <HeroBanner />
      <TheOpportunity />
      <WhoWeAre />
      <OurAdvantage />
      {/* <ScalableInvestmentTiers /> */}
      <WeBuildSuccessTogether />
    </div>
  )
}

export default Clientpage
