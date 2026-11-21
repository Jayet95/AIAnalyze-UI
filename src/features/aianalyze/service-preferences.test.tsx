import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalApi } from "./api";
import { FeedbackButtons, LocalServiceProvider } from "./service-preferences";

afterEach(cleanup);
describe("local feedback votes", () => {
  it("saves one health vote and prevents a second vote after acceptance", async () => {
    const api = new LocalApi();
    const send = vi.spyOn(api, "feedback").mockResolvedValue(undefined);
    render(<LocalServiceProvider api={api}><FeedbackButtons target="health" kind="memory-config" /></LocalServiceProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Helpful" }));
    await waitFor(() => expect(send).toHaveBeenCalledWith({ target: "health", kind: "memory-config", helpful: true }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Helpful" })).toBeNull());
    expect(send).toHaveBeenCalledTimes(1);
  });
  it("lets the user retry a rejected finding vote", async () => {
    const api = new LocalApi();
    const send = vi.spyOn(api, "feedback").mockRejectedValueOnce(new Error("Not saved")).mockResolvedValue(undefined);
    render(<LocalServiceProvider api={api}><FeedbackButtons target="finding" kind="GpuHot" /></LocalServiceProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Not helpful" }));
    await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Not helpful" }));
    await waitFor(() => expect(screen.queryByRole("button", { name: "Not helpful" })).toBeNull());
    expect(send).toHaveBeenCalledTimes(2);
    expect(send).toHaveBeenLastCalledWith({ target: "finding", kind: "GpuHot", helpful: false });
  });
});