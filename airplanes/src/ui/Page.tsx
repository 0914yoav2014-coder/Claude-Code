import ScrollController from '../scroll/ScrollController'
import LiteNotice from './LiteNotice'
import Loader from './Loader'
import MotionToggle from './MotionToggle'
import Nav from './Nav'
import Climb from './sections/Climb'
import Facts from './sections/Facts'
import Footer from './sections/Footer'
import GlobeSection from './sections/GlobeSection'
import HangarSection from './sections/HangarSection'
import Hero from './sections/Hero'
import Signup from './sections/Signup'

/**
 * Everything in front of the 3D stage (Frontend-owned; Lead stub). All words are real page text.
 * Section ids, data-testids and data-cam markers are frozen in docs/CONTRACTS.md.
 */
export default function Page() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Nav />
      <main id="main">
        <Hero />
        <Climb />
        <GlobeSection />
        <HangarSection />
        <Facts />
        <Signup />
      </main>
      <Footer />
      <MotionToggle />
      <LiteNotice />
      <Loader />
      <ScrollController />
    </>
  )
}
