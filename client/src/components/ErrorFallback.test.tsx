import { describe, it, expect, vi, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import ErrorFallback from "./ErrorFallback"

describe("ErrorFallback", () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it("shows an error message and a reload button", () => {
        render(<ErrorFallback />)
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
        expect(screen.getByRole("button", { name: /reload/i })).toBeInTheDocument()
    })

    it("reloads the page when the button is clicked", async () => {
        const reloadMock = vi.fn()
        vi.stubGlobal("location", { ...window.location, reload: reloadMock })

        render(<ErrorFallback />)
        await userEvent.click(screen.getByRole("button", { name: /reload/i }))
        expect(reloadMock).toHaveBeenCalled()
    })
})
