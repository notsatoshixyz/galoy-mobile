import { gql, useApolloClient, useReactiveVar, useSubscription } from "@apollo/client"
import { PaymentAmount, WalletCurrency } from "@app/types/amounts"
import * as React from "react"

import {
  PRICE_CACHE,
  prefCurrencyVar as primaryCurrencyVar,
} from "../graphql/client-only-query"
import useMainQuery from "./use-main-query"

type UseMyUpdates = {
  convertCurrencyAmount: (arg0: {
    amount: number
    from: CurrencyType
    to: CurrencyType
  }) => number
  convertPaymentAmount: <T extends WalletCurrency>(
    paymentAmount: PaymentAmount<WalletCurrency>,
    toCurrency: T,
  ) => PaymentAmount<T>
  convertPaymentAmountToPrimaryCurrency: (
    paymentAmount: PaymentAmount<WalletCurrency>,
  ) => PaymentAmount<WalletCurrency>
  usdPerBtc: PaymentAmount<WalletCurrency.USD>
  usdPerSat: string | null
  currentUsdWalletBalance: number | null
  currentBtcWalletBalance: number | null
  intraLedgerUpdate: {
    txNotificationType: string
    amount: number
    usdPerSat: number
  }
  lnUpdate: {
    paymentHash: string
    status: string
  }
  onChainUpdate: {
    txNotificationType: string
    txHash: string
    amount: number
    usdPerSat: number
  }
  mySubscriptionLoading: boolean
}

const MY_UPDATES_SUBSCRIPTION = gql`
  subscription myUpdates {
    myUpdates {
      errors {
        message
      }
      me {
        id
        defaultAccount {
          id
          wallets {
            id
            walletCurrency
            balance
          }
        }
      }
      update {
        type: __typename
        ... on Price {
          base
          offset
          currencyUnit
          formattedAmount
        }
        ... on LnUpdate {
          paymentHash
          status
        }
        ... on OnChainUpdate {
          txNotificationType
          txHash
          amount
          usdPerSat
        }
        ... on IntraLedgerUpdate {
          txNotificationType
          amount
          usdPerSat
        }
      }
    }
  }
`

// Private custom hook to get the initial price from cache (if set)
// in case the subscription failed to provide an initial price
const usePriceCache = (): [number, (newPrice: number) => void] => {
  const client = useApolloClient()
  const { initialBtcPrice } = useMainQuery()
  const [cachedPrice, setCachedPrice] = React.useState(() => {
    const lastPriceData = client.readQuery({ query: PRICE_CACHE })
    if (lastPriceData) {
      return lastPriceData.price
    } else if (initialBtcPrice) {
      client.writeQuery({
        query: PRICE_CACHE,
        data: { price: initialBtcPrice.formattedAmount },
      })
      return initialBtcPrice.formattedAmount
    }
    return 0
  })

  const updatePriceCache = React.useCallback(
    (newPrice) => {
      if (cachedPrice !== newPrice) {
        client.writeQuery({ query: PRICE_CACHE, data: { price: newPrice } })
        setCachedPrice(newPrice)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [cachedPrice],
  )

  React.useEffect(() => {
    if (!cachedPrice) {
      const lastPriceData = client.readQuery({ query: PRICE_CACHE })
      if (lastPriceData) {
        updatePriceCache(lastPriceData.price)
      } else if (initialBtcPrice) {
        updatePriceCache(initialBtcPrice.formattedAmount)
      } else {
        updatePriceCache(0)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialBtcPrice, cachedPrice])

  return [cachedPrice, updatePriceCache]
}

export const formatUsdAmount: (usd: number) => string = (usd) => {
  if (usd === 0 || usd >= 0.01) {
    return usd.toFixed(2)
  }
  return usd.toFixed(4)
}

export const useMySubscription = (): UseMyUpdates => {
  const { data, loading } = useSubscription(MY_UPDATES_SUBSCRIPTION)
  const {
    btcWalletBalance: btcWalletBalanceFromMainQuery,
    usdWalletBalance: usdWalletBalanceFromMainQuery,
  } = useMainQuery()
  const [cachedPrice, updatePriceCach] = usePriceCache()
  const intraLedgerUpdate = React.useRef<UseMyUpdates["intraLedgerUpdate"]>(null)
  const lnUpdate = React.useRef<UseMyUpdates["lnUpdate"]>(null)
  const onChainUpdate = React.useRef<UseMyUpdates["onChainUpdate"]>(null)

  const convertCurrencyAmount = React.useCallback(
    ({ amount, from, to }) => {
      if (cachedPrice === 0) {
        return NaN
      }
      if (from === "BTC" && to === "USD") {
        return (amount * cachedPrice) / 100
      }
      if (from === "USD" && to === "BTC") {
        return (100 * amount) / cachedPrice
      }
      return amount
    },
    [cachedPrice],
  )

  const convertPaymentAmount = React.useCallback(
    (paymentAmount, toCurrency: WalletCurrency) => {
      if (cachedPrice === 0) {
        return {
          amount: NaN,
          currency: toCurrency,
        }
      }

      if (
        paymentAmount.currency === WalletCurrency.BTC &&
        toCurrency === WalletCurrency.USD
      ) {
        return {
          amount: Math.round(paymentAmount.amount * cachedPrice),
          currency: WalletCurrency.USD,
        }
      }

      if (
        paymentAmount.currency === WalletCurrency.USD &&
        toCurrency === WalletCurrency.BTC
      ) {
        return {
          amount: Math.round(paymentAmount.amount / cachedPrice),
          currency: WalletCurrency.BTC,
        }
      }

      return {
        amount: Math.round(paymentAmount.amount),
        currency: paymentAmount.currency,
      }
    },
    [cachedPrice],
  )

  const primaryCurrency = useReactiveVar<CurrencyType>(primaryCurrencyVar)

  const convertPaymentAmountToPrimaryCurrency = (
    paymentAmount: PaymentAmount<WalletCurrency>,
  ) => convertPaymentAmount(paymentAmount, primaryCurrency as WalletCurrency)

  if (data?.myUpdates?.update) {
    if (data.myUpdates.update.type === "Price") {
      const { base, offset } = data.myUpdates.update
      updatePriceCach(base / 10 ** offset)
    }
    if (data.myUpdates.update.type === "IntraLedgerUpdate") {
      intraLedgerUpdate.current = data.myUpdates.update
    }
    if (data.myUpdates.update.type === "LnUpdate") {
      lnUpdate.current = data.myUpdates.update
    }
    if (data.myUpdates.update.type === "OnChainUpdate") {
      onChainUpdate.current = data.myUpdates.update
    }
  }

  const btcWalletBalanceFromSubscription =
    data?.myUpdates?.me?.defaultAccount?.wallets?.find(
      (wallet) => wallet?.__typename === "BTCWallet",
    )?.balance
  const btcWalletBalance = btcWalletBalanceFromSubscription
    ? btcWalletBalanceFromSubscription
    : btcWalletBalanceFromMainQuery

  const usdWalletBalanceFromSubscription =
    data?.myUpdates?.me?.defaultAccount?.wallets?.find(
      (wallet) => wallet?.__typename === "USDWallet",
    )?.balance
  const usdWalletBalance = usdWalletBalanceFromSubscription
    ? usdWalletBalanceFromSubscription
    : usdWalletBalanceFromMainQuery

  return {
    convertCurrencyAmount,
    convertPaymentAmount,
    convertPaymentAmountToPrimaryCurrency,
    usdPerBtc: {
      currency: WalletCurrency.USD,
      amount: cachedPrice === 0 ? NaN : cachedPrice * 100000000,
    },
    usdPerSat: cachedPrice === 0 ? null : (cachedPrice / 100).toFixed(8),
    currentBtcWalletBalance: btcWalletBalance,
    currentUsdWalletBalance: usdWalletBalance,
    intraLedgerUpdate: intraLedgerUpdate.current,
    lnUpdate: lnUpdate.current,
    onChainUpdate: onChainUpdate.current,
    mySubscriptionLoading: loading,
  }
}
