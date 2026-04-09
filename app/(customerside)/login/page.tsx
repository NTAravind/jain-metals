import { Suspense } from "react"
import { SignIn } from "../components/signin"

export default function LoginPage() {
    return(
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <SignIn/>
        </Suspense>
    )
}
