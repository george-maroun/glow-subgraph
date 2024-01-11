import {
  Donation,
  EarlyLiquidityOrDonationTransactionHashNonceManager,
  EarlyLiquidityPurchase,
} from "../generated/schema";
import { Purchase as PurchaseEvent } from "../generated/EarlyLiquidity/EarlyLiquidity";
import { User } from "../generated/schema";
import { getNextAvailableNonce } from "./shared/getNextAvailableNonce";
import { getOrCreateUser } from "./shared/getOrCreateUser";
import { BigInt } from "@graphprotocol/graph-ts";
import { getPastNonce } from "./shared/getPastNonce";
import { getDonationId } from "./minerPoolAndGCA";

export function handlePurchase(event: PurchaseEvent): void {
  const msg_sender = event.transaction.from;
  const msg_sender_hex = msg_sender.toHexString();
  let from = getOrCreateUser(msg_sender);

  const pastNonce = getPastNonce(from);
  let entity = new EarlyLiquidityPurchase(
    `elpurchase-${msg_sender_hex}-${pastNonce}`,
  );

  const matchingDonation = Donation.load(getDonationId(msg_sender, pastNonce));
  if (matchingDonation) {
    matchingDonation.isDonation = false;
    matchingDonation.save();
  }

  //
  entity.user = from.id;
  entity.glowReceived = event.params.glwReceived;
  entity.usdcSpent = event.params.totalUSDCSpent;
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  entity.save();
}