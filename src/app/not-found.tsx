// REACT CORE ==========================================================================================================
import Link from "next/link";

// LOCAL COMPONENTS ====================================================================================================
import { Report404 } from "@components/Analytics/Report404";

export default function NotFound() {
    return (
        <main style={{padding : "80px 24px", textAlign : "center"}}>
            <h1>Page not found</h1>
            <p>The page you are looking for does not exist, or may have moved.</p>
            <p><Link href="/">Go to the homepage</Link></p>
            <Report404 />
        </main>
    );
}
