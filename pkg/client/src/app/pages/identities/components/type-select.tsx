import React from "react";
import { useTranslation } from "react-i18next";

import { SelectVariant } from "@patternfly/react-core";
import { FilterIcon } from "@patternfly/react-icons/dist/esm/icons/filter-icon";

import { OptionWithValue, SimpleSelect } from "@app/shared/components";

import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { useField } from "formik";

export interface ITypeSelectProps {
  value?: OptionWithValue<"" | IdentityType>;
  onChange: any;
}
export type IdentityType = "sc" | "mvn" | "proxy";

export const SelectType: React.FC<ITypeSelectProps> = ({
  value = "",
  onChange,
}) => {
  const { t } = useTranslation();
  const [field, , helpers] = useField("kind");

  const identityTypeOptions: OptionWithValue<IdentityType>[] = [
    {
      value: "sc",
      toString: () => `Source Control`,
    },
    {
      value: "mvn",
      toString: () => `Maven Settings File`,
    },
    {
      value: "proxy",
      toString: () => `Proxy`,
    },
  ];

  return (
    <SimpleSelect
      toggleIcon={<FilterIcon />}
      width={220}
      variant={SelectVariant.single}
      aria-label="identity-type"
      aria-labelledby="identity-type"
      placeholderText={t("terms.type")}
      maxHeight={DEFAULT_SELECT_MAX_HEIGHT}
      value={value}
      options={identityTypeOptions}
      onChange={(selection) => {
        const selectionValue = (selection as OptionWithValue<string>).value;
        helpers.setValue(selectionValue);
        helpers.setValue(selection);
      }}
      //   onChange={onChange}
      onClear={() => helpers.setValue(undefined)}
    />
  );
};
