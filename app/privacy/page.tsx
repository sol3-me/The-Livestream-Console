export default function PrivacyPage() {
  return (
    <section className="py-10 container mx-auto px-4">
      <div className="max-w-3xl mx-auto prose prose-sm">
        <h1>Privacy Policy</h1>
        <p>Last updated: March 29, 2021</p>
        <h2>Simplified Summary</h2>
        <p>
          In short, we do not store or sell your information. This app was made solely to help
          people that want to easily control their YouTube livestreams. We only request the required
          permissions through the YouTube API and present any requested data directly to you.
        </p>
        <ul>
          <li>We only use your information to access the YouTube API and make requests for you.</li>
          <li>
            We do not store your personal information or any information we get from the YouTube
            API.
          </li>
          <li>We do not send your data anywhere other than the device you are browsing on.</li>
          <li>We plan to never advertise on this site.</li>
        </ul>
        <p>
          As of the time of writing, we do not retain your data for any length of time. This policy
          will be updated if this changes.
        </p>
        <h2>Interpretation and Definitions</h2>
        <h3>Interpretation</h3>
        <p>
          The words of which the initial letter is capitalized have meanings defined under the
          following conditions.
        </p>
        <h3>Definitions</h3>
        <ul>
          <li>
            <strong>Account</strong> means a unique account created for You to access our Service.
          </li>
          <li>
            <strong>Company</strong> refers to &quot;The Livestream Console&quot;.
          </li>
          <li>
            <strong>Cookies</strong> are small files placed on Your device by a website, containing
            details of your browsing history.
          </li>
          <li>
            <strong>Country</strong> refers to: United Kingdom
          </li>
          <li>
            <strong>Device</strong> means any device that can access the Service.
          </li>
          <li>
            <strong>Personal Data</strong> is any information that relates to an identified or
            identifiable individual.
          </li>
          <li>
            <strong>Service</strong> refers to the Website.
          </li>
        </ul>
        <h2>Collecting and Using Your Personal Data</h2>
        <p>
          We use Google OAuth to authenticate you and obtain a temporary access token to interact
          with the YouTube Data API v3 on your behalf. This token is stored in an encrypted session
          cookie on your browser and is never persisted on our servers.
        </p>
        <h2>Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, You can contact us by email:{' '}
          <a href="mailto:admin@sol3.me">admin@sol3.me</a>
        </p>
      </div>
    </section>
  );
}
