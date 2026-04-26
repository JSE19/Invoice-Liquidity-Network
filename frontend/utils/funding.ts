import { DailyFundingBucket } from "../components/charts/FundingChart";

export function transformFundingData(data: DailyFundingBucket[]) {
  return data.map((bucket) => {
    const row: any = {
      label: bucket.label,
      invoices_funded: bucket.invoices_funded,
      ...bucket,
    };
    bucket.tokens.forEach((t) => {
      row[t.symbol] = t.amount;
    });
    return row;
  });
}
