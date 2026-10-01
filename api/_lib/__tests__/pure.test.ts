import { describe, it, expect } from "vitest";
import { slugify } from "../slug";
import { estimateReadingTime } from "../readingTime";
import { extractContentImages } from "../images";

describe("slugify", () => {
  it("remove acentos e vira kebab-case", () => {
    expect(slugify("5 Tendências de Marketing para 2027!")).toBe("5-tendencias-de-marketing-para-2027");
  });
  it("nunca fica vazio", () => {
    expect(slugify("!!!")).toBe("item");
  });
});

describe("estimateReadingTime", () => {
  it("ignora tags HTML e arredonda pra 200 palavras/min", () => {
    const html = `<p>${"palavra ".repeat(400)}</p>`;
    expect(estimateReadingTime(html)).toBe(2);
  });
  it("nunca retorna menos que 1", () => {
    expect(estimateReadingTime("<p>oi</p>")).toBe(1);
  });
});

describe("extractContentImages", () => {
  it("pega todos os src de img no HTML", () => {
    const html = `<p>texto</p><img src="https://a.com/1.jpg"><img src='https://a.com/2.png'>`;
    expect(extractContentImages(html)).toEqual(["https://a.com/1.jpg", "https://a.com/2.png"]);
  });
  it("retorna vazio sem imagens", () => {
    expect(extractContentImages("<p>sem imagem</p>")).toEqual([]);
  });
});
