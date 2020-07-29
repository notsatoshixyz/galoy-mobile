import * as React from "react"
import { storiesOf } from "@storybook/react-native"
import { StoryScreen, Story, UseCase } from "../../../storybook/views"
import { InputPayment } from "."
import { CurrencyType } from "../../utils/enum"

declare let module

storiesOf("InputPayment", module)
  .addDecorator((fn) => <StoryScreen>{fn()}</StoryScreen>)
  .add("Style Presets", () => (
    <Story>
      <UseCase text="Editable" usage="Loading">
        <InputPayment currencyPreference={"USD"} price={0.00011} onSubmitEditing={() => {}} onUpdateAmount={() => {}} editable={true}/>
      </UseCase>
      <UseCase text="Non editable" usage="Loading">
        <InputPayment currencyPreference={"USD"} price={0.00011} initAmount={12345} onSubmitEditing={() => {}} onUpdateAmount={() => {}} editable={false}/>
      </UseCase>
    </Story>
  ))