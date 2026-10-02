import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, act, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


// A lista de chaves vem do servidor; aqui ela é simulada (sem rede, sem sessão).
vi.mock("../helpers", async (orig) => ({
  ...(await orig<typeof import("../helpers")>()),
  adminFetch: vi.fn(async (_url: string, init?: { method?: string }) =>
    init?.method === "POST"
      ? { key: "gm_" + "a1".repeat(20), id: "k2", name: "Teste", key_prefix: "gm_a1a1a1a1", created_at: new Date().toISOString() }
      : {
          data: [
            { id: "k1", name: "Agente de conteúdo", key_prefix: "gm_9f8e7d6c", created_at: "2026-09-01T12:00:00Z", last_used_at: null, revoked_at: null },
            { id: "k0", name: "Antiga", key_prefix: "gm_00000000", created_at: "2026-08-01T12:00:00Z", last_used_at: "2026-08-02T12:00:00Z", revoked_at: "2026-08-03T12:00:00Z" },
          ],
        },
  ),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { ApiKeys, GROUPS } from "../ApiKeys";
import { adminFetch } from "../helpers";

const BASE = `${window.location.origin}/api/public/v1`;
let writeText: ReturnType<typeof vi.fn>;

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ApiKeys />
    </QueryClientProvider>,
  );
}

async function clickCopy(btn: HTMLElement) {
  await act(async () => { fireEvent.click(btn); });
}

function expectCopied(btn: HTMLElement, text: string) {
  expect(writeText).toHaveBeenLastCalledWith(text);
  expect(btn).toHaveAttribute("data-copied", "true");
  expect(btn.getAttribute("aria-label")).toMatch(/copiado$/);
  expect(btn).toHaveClass("bg-accent");
}

beforeEach(() => {
  writeText = vi.fn(() => Promise.resolve());
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
});

describe("Manual da API — abas", () => {
  it("mostra uma aba por seção e começa em Consultas", () => {
    setup();
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(GROUPS.map((g) => g.title));
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName(GROUPS[0]!.title);
  });

  it.each(GROUPS.map((g) => [g.title, g] as const))("aba %s mostra seus endpoints", (_t, g) => {
    setup();
    fireEvent.click(screen.getByRole("tab", { name: g.title }));
    const tab = screen.getByRole("tab", { name: g.title });
    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(tab).toHaveAttribute("tabindex", "0");
    const panel = screen.getByRole("tabpanel");
    expect(panel).toHaveAttribute("aria-labelledby", tab.id);
    expect(within(panel).getByRole("heading", { name: g.title })).toBeInTheDocument();
    for (const e of g.eps) expect(within(panel).getAllByText(e.path).length).toBeGreaterThan(0);
    // Só a aba ativa entra no Tab do teclado
    screen.getAllByRole("tab").filter((t) => t !== tab).forEach((t) => expect(t).toHaveAttribute("tabindex", "-1"));
  });

  it("navega pelas abas com setas, Home e End", () => {
    setup();
    const list = screen.getByRole("tablist");
    const tabs = () => screen.getAllByRole("tab");
    tabs()[0]!.focus();
    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(tabs()[1]).toHaveAttribute("aria-selected", "true");
    expect(tabs()[1]).toHaveFocus();
    fireEvent.keyDown(list, { key: "End" });
    expect(tabs()[GROUPS.length - 1]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(list, { key: "ArrowRight" });
    expect(tabs()[0]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(list, { key: "ArrowLeft" });
    expect(tabs()[GROUPS.length - 1]).toHaveAttribute("aria-selected", "true");
    fireEvent.keyDown(list, { key: "Home" });
    expect(tabs()[0]).toHaveFocus();
  });
});

describe("Botões de copiar", () => {
  it("copia o endereço base e o cabeçalho com feedback visual", async () => {
    setup();
    const baseBtn = screen.getByRole("button", { name: "Copiar endereço base" });
    await clickCopy(baseBtn);
    expectCopied(baseBtn, BASE);
    expect(screen.getByRole("status")).toHaveTextContent("Copiado");

    const hdr = screen.getByRole("button", { name: "Copiar cabeçalho" });
    await clickCopy(hdr);
    expectCopied(hdr, "Authorization: Bearer SUA_CHAVE");
    // o anterior volta ao normal quando outro é copiado
    expect(baseBtn).toHaveAttribute("data-copied", "false");
    expect(baseBtn).toHaveAccessibleName("Copiar endereço base");
  });

  it.each(GROUPS.map((g) => [g.title, g] as const))("aba %s: copia cada endereço e cada exemplo", async (_t, g) => {
    setup();
    fireEvent.click(screen.getByRole("tab", { name: g.title }));
    const panel = screen.getByRole("tabpanel");
    for (const e of g.eps) {
      const addr = within(panel).getByRole("button", { name: `Copiar endereço ${e.m} ${e.path} (${e.desc})` });
      await clickCopy(addr);
      expectCopied(addr, `${BASE}${e.path}`);
      if (e.body) {
        const ex = within(panel).getByRole("button", { name: `Copiar exemplo ${e.m} ${e.path} (${e.desc})` });
        await clickCopy(ex);
        expectCopied(ex, e.body);
      }
    }
  });

  it("o feedback some sozinho depois de 2 segundos", async () => {
    vi.useFakeTimers();
    setup();
    const btn = screen.getByRole("button", { name: "Copiar endereço base" });
    await clickCopy(btn);
    expect(btn).toHaveAttribute("data-copied", "true");
    await act(async () => { vi.advanceTimersByTime(2100); });
    expect(btn).toHaveAttribute("data-copied", "false");
    vi.useRealTimers();
  });

  it("todos os botões de copiar são alcançáveis pelo teclado e têm foco visível", () => {
    setup();
    for (const g of GROUPS) {
      fireEvent.click(screen.getByRole("tab", { name: g.title }));
      screen.getAllByRole("button", { name: /^Copiar / }).forEach((b) => {
        expect(b.tagName).toBe("BUTTON");
        expect(b).not.toHaveAttribute("tabindex", "-1");
        expect(b.className).toMatch(/focus-visible:ring/);
      });
    }
  });
});

describe("Chaves de acesso", () => {
  it("lista as chaves do servidor e marca a desativada", async () => {
    setup();
    expect(await screen.findByText("Agente de conteúdo")).toBeInTheDocument();
    expect(screen.getByText("gm_9f8e7d6c…")).toBeInTheDocument();
    expect(screen.getByText("1 ativa(s) · cada agente deve ter a sua")).toBeInTheDocument();
    expect(screen.getByText("Desativada")).toBeInTheDocument();
  });

  it("cria uma chave pelo servidor e mostra o valor inteiro uma única vez", async () => {
    setup();
    await screen.findByText("Agente de conteúdo");
    fireEvent.change(screen.getByLabelText("Nome da nova chave"), { target: { value: "Teste" } });
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: /Criar chave/ })); });
    expect(adminFetch).toHaveBeenCalledWith("/api/admin/api-keys", { method: "POST", body: { name: "Teste" } });
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("gm_" + "a1".repeat(20));
    fireEvent.click(within(alert).getByRole("button", { name: "Já copiei" }));
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("desativar pede confirmação e chama PATCH com o id", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    setup();
    await screen.findByText("Agente de conteúdo");
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Desativar" })); });
    expect(adminFetch).toHaveBeenCalledWith("/api/admin/api-keys?id=k1", { method: "PATCH" });
  });
});
