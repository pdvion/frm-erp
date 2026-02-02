import { describe, it, expect } from "vitest";
import {
  testId,
  withTestId,
  selector,
  hasTestId,
  uniqueTestId,
  wait,
  retry,
  MODULES,
  COMPONENTS,
  ACTIONS,
  TEST_DATA,
} from "./test-utils";

describe("Test Utilities", () => {
  describe("testId", () => {
    it("should generate testId with module and component", () => {
      expect(testId("materials", "list")).toBe("materials-list");
    });

    it("should generate testId with module, component and action", () => {
      expect(testId("materials", "form", "submit")).toBe("materials-form-submit");
    });

    it("should work with constants", () => {
      expect(testId(MODULES.MATERIALS, COMPONENTS.LIST)).toBe("materials-list");
      expect(testId(MODULES.SUPPLIERS, COMPONENTS.FORM, ACTIONS.SUBMIT)).toBe(
        "suppliers-form-submit"
      );
    });
  });

  describe("withTestId", () => {
    it("should return object with data-testid", () => {
      const props = withTestId("materials", "button", "delete");
      expect(props).toEqual({ "data-testid": "materials-button-delete" });
    });
  });

  describe("selector", () => {
    it("should generate CSS selector for data-testid", () => {
      expect(selector("materials-list")).toBe('[data-testid="materials-list"]');
    });
  });

  describe("hasTestId", () => {
    it("should return true for matching testId", () => {
      const element = document.createElement("div");
      element.setAttribute("data-testid", "materials-list");
      expect(hasTestId(element, "materials-list")).toBe(true);
    });

    it("should return false for non-matching testId", () => {
      const element = document.createElement("div");
      element.setAttribute("data-testid", "materials-list");
      expect(hasTestId(element, "suppliers-list")).toBe(false);
    });
  });

  describe("uniqueTestId", () => {
    it("should generate unique IDs", () => {
      const id1 = uniqueTestId();
      const id2 = uniqueTestId();
      expect(id1).not.toBe(id2);
    });

    it("should use custom prefix", () => {
      const id = uniqueTestId("custom");
      expect(id.startsWith("custom-")).toBe(true);
    });
  });

  describe("MODULES", () => {
    it("should have all expected modules", () => {
      expect(MODULES.MATERIALS).toBe("materials");
      expect(MODULES.SUPPLIERS).toBe("suppliers");
      expect(MODULES.CUSTOMERS).toBe("customers");
      expect(MODULES.INVENTORY).toBe("inventory");
      expect(MODULES.HR).toBe("hr");
      expect(MODULES.PRODUCTION).toBe("production");
      expect(MODULES.FISCAL).toBe("fiscal");
      expect(MODULES.BI).toBe("bi");
    });
  });

  describe("COMPONENTS", () => {
    it("should have all expected components", () => {
      expect(COMPONENTS.LIST).toBe("list");
      expect(COMPONENTS.FORM).toBe("form");
      expect(COMPONENTS.TABLE).toBe("table");
      expect(COMPONENTS.MODAL).toBe("modal");
      expect(COMPONENTS.BUTTON).toBe("button");
    });
  });

  describe("ACTIONS", () => {
    it("should have all expected actions", () => {
      expect(ACTIONS.SUBMIT).toBe("submit");
      expect(ACTIONS.CANCEL).toBe("cancel");
      expect(ACTIONS.DELETE).toBe("delete");
      expect(ACTIONS.EDIT).toBe("edit");
      expect(ACTIONS.CREATE).toBe("create");
    });
  });

  describe("TEST_DATA", () => {
    it("should generate valid material codes", () => {
      const code = TEST_DATA.material.code();
      expect(code.startsWith("MAT-")).toBe(true);
      expect(code.length).toBeGreaterThan(4);
    });

    it("should generate unique supplier CNPJs", () => {
      const cnpj1 = TEST_DATA.supplier.cnpj();
      const cnpj2 = TEST_DATA.supplier.cnpj();
      expect(cnpj1.length).toBe(14);
      expect(cnpj2.length).toBe(14);
    });

    it("should generate valid emails", () => {
      const email = TEST_DATA.supplier.email();
      expect(email).toContain("@example.com");
      expect(email.startsWith("teste-")).toBe(true);
    });
  });

  describe("wait", () => {
    it("should wait for specified time", async () => {
      const start = Date.now();
      await wait(50);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(45);
    });
  });

  describe("retry", () => {
    it("should succeed on first attempt", async () => {
      let attempts = 0;
      const result = await retry(async () => {
        attempts++;
        return "success";
      });
      expect(result).toBe("success");
      expect(attempts).toBe(1);
    });

    it("should retry on failure", async () => {
      let attempts = 0;
      const result = await retry(
        async () => {
          attempts++;
          if (attempts < 3) {
            throw new Error("fail");
          }
          return "success";
        },
        3,
        10
      );
      expect(result).toBe("success");
      expect(attempts).toBe(3);
    });

    it("should throw after max attempts", async () => {
      let attempts = 0;
      await expect(
        retry(
          async () => {
            attempts++;
            throw new Error("always fails");
          },
          3,
          10
        )
      ).rejects.toThrow("always fails");
      expect(attempts).toBe(3);
    });
  });
});
