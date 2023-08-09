// TODO do we want useSelectionStateCommon or does that stuff belong in use/getDerivedSelectionState?

// TODO isItemSelectable in derived state fn
// TODO how to handle the useEffect to deselect unselectable items when present if we define that logic in derived state?
//      maybe the derived state returns selectedItems with them filtered by selectable. memoize that?
// TODO how do we handle letting the user select items across multiple pages when some items may be unloaded?
//      -- in useSelectionDerivedState, keep a cache of all the selected items we've seen by id, and keep them up to date when new item data comes in via useEffect.
//      -- return selectedItems by mapping ids to either the item from the current page if present, or an item from the cache if missing (preserve referential equality with same-page stuff in the table row logic -- maybe that'll still work if it just all comes from the cache? test it).
//      -- this won't work if we're reloading the page and restoring from url params...
// TODO how do we handle "select all"? probably we don't, right? or just select the current page?
//      -- but we still want it for local?

// TODO restructure useSelectionState and useSelectionUrlParams like the other concerns in table hooks - rely on idProperty, etc
// TODO nice to have... figure out how to make the URL param piece of it optional? give useUrlParams a disabled flag? maybe make that optional for all the concerns? play around with that...
// TODO nice to have... make useUrlParams just omit the param from the URL if it is using the default -- does this prevent all the history.replace thrashing on first page mount?

// TODO figure out where it is being used right now with useLocalTableControls and play with it there

// TODO should we rename ActiveRowState to ActiveItemState? everything is driven from items not rows?

import * as React from "react";
import { useUrlParams } from "../../useUrlParams";
import { IExtraArgsForURLParamHooks } from "../types";

export interface ISelectionState {
  selectedItemIds: (string | number)[];
  setSelectedItemIds: (newSelectedItemIds: (string | number)[]) => void;
  isItemIdSelected: (id: string | number) => boolean;
  toggleItemIdSelected: (id: string | number, isSelecting?: boolean) => void;
  selectMultipleItemIds: (
    ids: (string | number)[],
    isSelecting: boolean
  ) => void;
}

export interface ISelectionStateArgs {
  initialSelectedItemIds?: (string | number)[];
}

const useSelectionStateCommon = (
  state: Pick<ISelectionState, "selectedItemIds" | "setSelectedItemIds">
): ISelectionState => {
  const { selectedItemIds, setSelectedItemIds } = state;
  return {
    ...state,
    isItemIdSelected: (id) => selectedItemIds.includes(id),
    toggleItemIdSelected: (id, isSelecting) =>
      isSelecting
        ? [...selectedItemIds, id]
        : selectedItemIds.filter((i) => i !== id),
    selectMultipleItemIds: (ids, isSelecting) => {
      const otherSelectedIds = selectedItemIds.filter(
        (selectedId) => !ids.some((i) => i === selectedId)
      );
      if (isSelecting) {
        setSelectedItemIds([...otherSelectedIds, ...ids]);
      } else {
        setSelectedItemIds(otherSelectedIds);
      }
    },
  };
};

export const useSelectionState = ({
  initialSelectedItemIds = [],
}: ISelectionStateArgs): ISelectionState => {
  const [selectedItemIds, setSelectedItemIds] = React.useState(
    initialSelectedItemIds
  );
  return useSelectionStateCommon({ selectedItemIds, setSelectedItemIds });
};

export const useSelectionUrlParams = <
  TURLParamKeyPrefix extends string = string
>({
  initialSelectedItemIds = [],
  urlParamKeyPrefix,
}: ISelectionStateArgs &
  IExtraArgsForURLParamHooks<TURLParamKeyPrefix> = {}): ISelectionState => {
  const [selectedItemIds, setSelectedItemIds] = useUrlParams({
    keyPrefix: urlParamKeyPrefix,
    keys: ["selectedItems"],
    defaultValue: initialSelectedItemIds,
    serialize: (selectedItemIds) => ({
      selectedItems: JSON.stringify(selectedItemIds),
    }),
    deserialize: ({ selectedItems: selectedItemsStr }) => {
      try {
        return JSON.parse(selectedItemsStr || "{}");
      } catch (e) {
        return [];
      }
    },
  });
  return useSelectionStateCommon({ selectedItemIds, setSelectedItemIds });
};
