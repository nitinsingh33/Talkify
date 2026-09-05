import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router-dom"
import EmailVerifyBanner from "./EmailVerifyBanner"

const navigateMock = vi.fn()
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom")
    return { ...actual, useNavigate: () => navigateMock }
})

describe("EmailVerifyBanner", () => {
    it("shows the verification nudge", () => {
        render(<EmailVerifyBanner />, { wrapper: MemoryRouter })
        expect(screen.getByText(/email isn't verified/i)).toBeInTheDocument()
    })

    it("navigates to /verify-email when 'Verify now' is clicked", async () => {
        render(<EmailVerifyBanner />, { wrapper: MemoryRouter })
        await userEvent.click(screen.getByRole("button", { name: /verify now/i }))
        expect(navigateMock).toHaveBeenCalledWith("/verify-email")
    })

    it("hides itself when dismissed", async () => {
        render(<EmailVerifyBanner />, { wrapper: MemoryRouter })
        await userEvent.click(screen.getByTitle(/dismiss/i))
        expect(screen.queryByText(/email isn't verified/i)).not.toBeInTheDocument()
    })
})
