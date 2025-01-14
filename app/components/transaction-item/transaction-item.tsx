import * as React from "react"
import { useState, useEffect } from "react"
import { StackNavigationProp } from "@react-navigation/stack"
import { ListItem } from "react-native-elements"
import { Text } from "react-native"
import EStyleSheet from "react-native-extended-stylesheet"
import Icon from "react-native-vector-icons/Ionicons"
import { IconTransaction } from "../icon-transactions"
import { palette } from "../../theme/palette"
import { CompositeNavigationProp, ParamListBase } from "@react-navigation/native"
import { prefCurrencyVar as primaryCurrencyVar } from "../../graphql/client-only-query"
import { useHideBalance } from "../../hooks"
import { satAmountDisplay, usdAmountDisplay } from "@app/utils/currencyConversion"
import { GaloyGQL } from "@galoymoney/client"
import { WalletCurrency } from "@app/types/amounts"
import { WalletType } from "@app/utils/enum"
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs"
import { TransactionDate } from "../transaction-date"

const styles = EStyleSheet.create({
  container: {
    paddingVertical: 9,
    borderColor: palette.lighterGrey,
    borderBottomWidth: "2rem",
    overflow: "hidden",
  },
  containerFirst: {
    borderTopLeftRadius: "12rem",
    borderTopRightRadius: "12rem",
  },
  containerLast: {
    borderBottomWitdth: 0,
    borderBottomLeftRadius: "12rem",
    borderBottomRightRadius: "12rem",
  },
  hiddenBalanceContainer: {
    fontSize: "16rem",
  },

  pending: {
    color: palette.midGrey,
  },

  receive: {
    color: palette.green,
  },

  send: {
    color: palette.darkGrey,
  },
})

export interface TransactionItemProps {
  navigation:
    | CompositeNavigationProp<
        BottomTabNavigationProp<ParamListBase>,
        StackNavigationProp<ParamListBase>
      >
    | StackNavigationProp<ParamListBase>
  isFirst?: boolean
  isLast?: boolean
  tx: GaloyGQL.Transaction
  subtitle?: boolean
}

const computeUsdAmount = (tx: GaloyGQL.Transaction) => {
  const { settlementAmount, settlementPrice } = tx
  const { base, offset } = settlementPrice
  const usdPerSat = base / 10 ** offset / 100
  return settlementAmount * usdPerSat
}

const descriptionDisplay = (tx: GaloyGQL.Transaction) => {
  const { memo, direction, settlementVia } = tx
  if (memo) {
    return memo
  }

  const isReceive = direction === "RECEIVE"

  switch (settlementVia.__typename) {
    case "SettlementViaOnChain":
      return "OnChain Payment"
    case "SettlementViaLn":
      return "Invoice"
    case "SettlementViaIntraLedger":
      return isReceive
        ? `From ${settlementVia.counterPartyUsername || "BitcoinBeach Wallet"}`
        : `To ${settlementVia.counterPartyUsername || "BitcoinBeach Wallet"}`
  }
}

const amountDisplayStyle = ({ isReceive, isPending }) => {
  if (isPending) {
    return styles.pending
  }

  return isReceive ? styles.receive : styles.send
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  tx,
  navigation,
  isFirst = false,
  isLast = false,
  subtitle = false,
}: TransactionItemProps) => {
  const primaryCurrency = primaryCurrencyVar()
  const hideBalance = useHideBalance()

  const isReceive = tx.direction === "RECEIVE"
  const isPending = tx.status === "PENDING"
  const description = descriptionDisplay(tx)
  const usdAmount = computeUsdAmount(tx)
  const [txHideBalance, setTxHideBalance] = useState(hideBalance)

  useEffect(() => {
    setTxHideBalance(hideBalance)
  }, [hideBalance])

  const pressTxAmount = () => setTxHideBalance((prev) => !prev)

  return (
    <ListItem
      containerStyle={[
        styles.container,
        isFirst ? styles.containerFirst : {},
        isLast ? styles.containerLast : {},
      ]}
      onPress={() =>
        navigation.navigate("transactionDetail", {
          ...tx,
          walletType: tx.settlementCurrency,
          isReceive,
          isPending,
          description,
          usdAmount,
        })
      }
    >
      <IconTransaction
        onChain={tx.settlementVia.__typename === "SettlementViaOnChain"}
        isReceive={isReceive}
        pending={isPending}
        walletType={tx.settlementCurrency as WalletType}
      />
      <ListItem.Content>
        <ListItem.Title>{description}</ListItem.Title>
        <ListItem.Subtitle>
          {subtitle ? (
            <TransactionDate tx={tx} diffDate={true} friendly={true} />
          ) : undefined}
        </ListItem.Subtitle>
      </ListItem.Content>
      {txHideBalance ? (
        <Icon style={styles.hiddenBalanceContainer} name="eye" onPress={pressTxAmount} />
      ) : (
        <Text
          style={amountDisplayStyle({ isReceive, isPending })}
          onPress={hideBalance ? pressTxAmount : undefined}
        >
          {primaryCurrency === "BTC" && tx.settlementCurrency === WalletCurrency.BTC
            ? satAmountDisplay(tx.settlementAmount)
            : usdAmountDisplay(usdAmount)}
        </Text>
      )}
    </ListItem>
  )
}
