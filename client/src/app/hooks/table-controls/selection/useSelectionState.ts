// TODO see discussion on thread with Scott.
//      We want to preserve selection when filter/pagination changes, as objects,
//      and update the objects as possible when new data comes in.
//      We do NOT want to persist selections in the URL.
// TODO to avoid requiring the TItem type in useTableControlState/useTableControlUrlParams,
//      maybe do actually keep only ids in state and handle the caching of selected objects we've seen in useSelectionDerivedState
//      but still allow a `initialSelectedItemIds` to be passed?

// TODO do we want useSelectionStateCommon or does that stuff belong in useSelectionDerivedState?

// TODO isItemSelectable in derived state fn
// TODO how to handle the useEffect to deselect unselectable items when present if we define that logic in derived state?
// TODO how do we handle letting the user select items across multiple pages when some items may be unloaded?
//      -- in useSelectionDerivedState, keep a cache of all the selected items we've seen by id, and keep them up to date when new item data comes in via useEffect.
//      -- return selectedItems by mapping ids to either the item from the current page if present, or an item from the cache if missing (preserve referential equality with same-page stuff in the table row logic -- maybe that'll still work if it just all comes from the cache? test it).
// TODO "select all" does not apply on server-driven tables, only "select page". how do we specify/detect which we need?

// TODO UNRELATED nice to have... make useUrlParams just omit the param from the URL if it is using the default -- does this prevent all the history.replace thrashing on first page mount?
// TODO UNRELATED should we rename ActiveRowState to ActiveItemState? everything is driven from items not rows?

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
