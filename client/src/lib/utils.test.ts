import { describe, it, expect } from "vitest"
import { cn } from "./utils"

describe("cn", () => {
    it("joins simple class names", () => {
        expect(cn("a", "b", "c")).toBe("a b c")
    })

    it("drops falsy values", () => {
        expect(cn("a", false, undefined, null, "", "b")).toBe("a b")
    })

    it("lets a later conflicting Tailwind class win", () => {
        expect(cn("px-2", "px-4")).toBe("px-4")
    })

    it("merges conditional object syntax", () => {
        expect(cn("base", { active: true, hidden: false })).toBe("base active")
    })
})
