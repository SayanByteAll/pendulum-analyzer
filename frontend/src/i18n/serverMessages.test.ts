import { describe, expect, it } from "vitest";

import { translateServerMessage } from "./serverMessages";

describe("translateServerMessage", () => {
  it("translates exact messages", () => {
    expect(translateServerMessage("Видео уже обрабатывается", "en")).toBe(
      "The video is already being processed",
    );
    expect(translateServerMessage("Нет связи с сервером", "kk")).toBe("Сервермен байланыс жоқ");
    expect(translateServerMessage("Видео уже обрабатывается", "ru")).toBe("Видео уже обрабатывается");
  });

  it("translates messages with interpolated values", () => {
    expect(translateServerMessage("Ошибка сервера (502)", "en")).toBe("Server error (502)");
    expect(translateServerMessage("Файл больше 500 МБ", "en")).toBe("The file is larger than 500 MB");
    expect(translateServerMessage("Груз найден только на 12 кадрах — нужно хотя бы 30.", "kk")).toBe(
      "Жүк тек 12 кадрда табылды — кемінде 30 кадр қажет.",
    );
    expect(translateServerMessage("Замер не найден(о)", "en")).toBe("Trial not found");
    expect(translateServerMessage("Эксперимент не найден", "en")).toBe("Experiment not found");
  });

  it("translates known fragments inside validation errors", () => {
    expect(
      translateServerMessage(
        "end: Value error, Конец участка должен быть позже начала; start: Field required",
        "en",
      ),
    ).toBe("end: The segment end must be after its start; start: Field required");
  });

  it("returns unknown messages unchanged", () => {
    expect(translateServerMessage("Что-то совсем новое", "en")).toBe("Что-то совсем новое");
    expect(translateServerMessage("", "kk")).toBe("");
  });
});
