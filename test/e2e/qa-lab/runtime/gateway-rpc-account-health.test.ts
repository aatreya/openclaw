import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  runGatewayRpcAccountHealthProof,
  withSiblingAccount,
} from "./gateway-rpc-account-health.js";

describe("Gateway RPC account health producer", () => {
  it("adds one sibling without replacing existing QA channel config", () => {
    const config = withSiblingAccount({
      channels: {
        "qa-channel": {
          enabled: true,
          baseUrl: "http://127.0.0.1:43124",
          accounts: { existing: { enabled: false } },
        },
      },
    } as never);

    expect(config.channels?.["qa-channel"]).toEqual({
      enabled: true,
      baseUrl: "http://127.0.0.1:43124",
      accounts: {
        existing: { enabled: false },
        sibling: { enabled: true },
      },
    });
  });

  it.runIf(process.env.OPENCLAW_QA_REAL_GATEWAY === "1")(
    "proves authenticated health/status RPC and a targeted account config reload",
    async () => {
      const proof = await runGatewayRpcAccountHealthProof(
        path.resolve(import.meta.dirname, "../../../.."),
      );

      expect(proof.initialHealthOk).toBe(true);
      expect(proof.initialStatusVisible).toBe(true);
      expect(proof.initialAccounts.default).toMatchObject({
        enabled: true,
        configured: true,
        running: true,
      });
      expect(proof.initialAccounts.sibling).toMatchObject({
        enabled: true,
        configured: true,
        running: true,
      });
      expect(proof.onlyTargetConfigChanged).toBe(true);
      expect(proof.finalAccounts.default).toMatchObject({
        enabled: true,
        configured: true,
        running: true,
      });
      expect(proof.finalAccounts.sibling).toMatchObject({
        enabled: false,
        configured: true,
        running: false,
      });
      expect(proof.finalStatusVisible).toBe(true);
    },
    180_000,
  );
});
