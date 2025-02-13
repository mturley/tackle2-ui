import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  cellWidth,
  ICell,
  IExtraData,
  IRow,
  IRowData,
  sortable,
  truncate,
} from "@patternfly/react-table";
import {
  ActionGroup,
  Button,
  ButtonVariant,
  Card,
  CardBody,
  Checkbox,
  FormGroup,
  ToolbarChip,
  ToolbarItem,
} from "@patternfly/react-core";
import { ExclamationTriangleIcon } from "@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon";
import { global_palette_gold_400 as gold } from "@patternfly/react-tokens";

import { useDispatch } from "react-redux";
import { alertActions } from "@app/store/alert";
import { bulkCopyActions } from "@app/store/bulkCopy";

import {
  ApplicationToolbarToggleGroup,
  AppTableWithControls,
  StatusIcon,
  ToolbarBulkSelector,
} from "@app/shared/components";
import {
  useFetch,
  useMultipleFetch,
  useTableControls,
  useToolbarFilter,
  useSelectionFromPageState,
  useFetchPagination,
} from "@app/shared/hooks";

import {
  Application,
  ApplicationPage,
  Assessment,
  Review,
  SortByQuery,
} from "@app/api/models";

import {
  createBulkCopyAssessment,
  createBulkCopyReview,
  getApplications,
  getAssessments,
} from "@app/api/rest";
import { getAxiosErrorMessage } from "@app/utils/utils";

import { ApplicationBusinessService } from "../application-business-service";
import { ApplicationAssessment } from "../application-assessment";
import { usePaginationState } from "@app/shared/hooks/usePaginationState";
import identities from "@app/pages/identities";
import {
  FilterCategory,
  FilterToolbar,
  FilterType,
} from "@app/shared/components/FilterToolbar";
import { useFilterState } from "@app/shared/hooks/useFilterState";
import { useSortState } from "@app/shared/hooks/useSortState";
import { useSelectionState } from "@konveyor/lib-ui";

const ENTITY_FIELD = "entity";

const getRow = (rowData: IRowData): Application => {
  return rowData[ENTITY_FIELD];
};

const searchAppAssessment = (id: number) => {
  const result = getAssessments({ applicationId: id }).then(({ data }) =>
    data[0] ? data[0] : undefined
  );
  return result;
};

interface BulkCopyAssessmentReviewFormProps {
  application: Application;
  assessment: Assessment;
  review?: Review;
  onSaved: () => void;
}

export const BulkCopyAssessmentReviewForm: React.FC<
  BulkCopyAssessmentReviewFormProps
> = ({ application, assessment, review, onSaved }) => {
  // i18
  const { t } = useTranslation();

  // Redux
  const dispatch = useDispatch();

  // Local state
  const [requestConfirmation, setRequestConfirmation] = useState(false);
  const [confirmationAccepted, setConfirmationAccepted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchApplications = useCallback(() => {
    return getApplications();
  }, []);

  const {
    data: page,
    isFetching,
    fetchError,
    requestFetch: refreshTable,
  } = useFetch<Array<Application>>({
    defaultIsFetching: true,
    onFetch: fetchApplications,
  });

  const applications = useMemo(() => {
    return page ? page : undefined;
  }, [page]);

  useEffect(() => {
    refreshTable();
  }, [refreshTable]);

  const filterCategories: FilterCategory<Application>[] = [
    {
      key: "name",
      title: "Name",
      type: FilterType.search,
      placeholderText: "Filter by name...",
      getItemValue: (item) => {
        return item?.name || "";
      },
    },
  ];

  const { filterValues, setFilterValues, filteredItems } = useFilterState(
    applications || [],
    filterCategories
  );
  const getSortValues = (identity: Application) => [
    identity?.name || "",
    "", // Action column
  ];

  const { sortBy, onSort, sortedItems } = useSortState(
    filteredItems,
    getSortValues
  );

  const { currentPageItems, setPageNumber, paginationProps } =
    usePaginationState(sortedItems, 10);

  // Table's assessments
  const {
    getData: getApplicationAssessment,
    isFetching: isFetchingApplicationAssessment,
    fetchError: fetchErrorApplicationAssessment,
    fetchCount: fetchCountApplicationAssessment,
    triggerFetch: fetchApplicationsAssessment,
  } = useMultipleFetch<number, Assessment | undefined>({
    onFetchPromise: searchAppAssessment,
  });

  useEffect(() => {
    if (applications) {
      fetchApplicationsAssessment(applications.map((f) => f.id!));
    }
  }, [applications, fetchApplicationsAssessment]);

  // Select rows
  const {
    isItemSelected: isRowSelected,
    toggleItemSelected: toggleRowSelected,
    selectAll,
    selectMultiple,
    areAllSelected,
    selectedItems: selectedRows,
  } = useSelectionState<Application>({
    items: applications || [],
    isEqual: (a, b) => a.id === b.id,
  });

  const filterInvalidRows = (rows?: Application[]) => {
    return (rows ? rows : []).filter((f) => f.id !== application.id);
  };

  // Table
  const columns: ICell[] = [
    {
      title: t("terms.name"),
      transforms: [sortable, cellWidth(40)],
      cellTransforms: [truncate],
    },
    {
      title: t("terms.businessService"),
      transforms: [cellWidth(30)],
      cellTransforms: [truncate],
    },
    {
      title: t("terms.assessment"),
      transforms: [cellWidth(15)],
      cellTransforms: [truncate],
    },
    {
      title: t("terms.review"),
      transforms: [cellWidth(15)],
      cellTransforms: [truncate],
    },
  ];

  const rows: IRow[] = [];
  currentPageItems?.forEach((item) => {
    const isSelected = isRowSelected(item);

    rows.push({
      [ENTITY_FIELD]: item,
      selected: isSelected,
      disableSelection: item.id === application.id,
      cells: [
        {
          title: item.name,
        },
        {
          title: (
            <>
              {item.businessService && (
                <ApplicationBusinessService id={item.businessService.id} />
              )}
            </>
          ),
        },
        {
          title: (
            <ApplicationAssessment
              assessment={getApplicationAssessment(item.id!)}
              isFetching={isFetchingApplicationAssessment(item.id!)}
              fetchError={fetchErrorApplicationAssessment(item.id!)}
              fetchCount={fetchCountApplicationAssessment(item.id!)}
            />
          ),
        },
        {
          title: item.review ? (
            <StatusIcon status="Completed" />
          ) : (
            <StatusIcon status="NotStarted" />
          ),
        },
      ],
    });
  });

  // Row actions
  const selectRow = (
    event: React.FormEvent<HTMLInputElement>,
    isSelected: boolean,
    rowIndex: number,
    rowData: IRowData,
    extraData: IExtraData
  ) => {
    const row = getRow(rowData);
    toggleRowSelected(row);
  };

  // Confirmation checbox
  useEffect(() => {
    let selectedAnyAppWithAssessment = selectedRows.some((f) =>
      getApplicationAssessment(f.id!)
    );

    if (review) {
      const selectedAnyAppWithReview = selectedRows.some((f) => f.review);
      selectedAnyAppWithAssessment =
        selectedAnyAppWithAssessment || selectedAnyAppWithReview;
    }

    setRequestConfirmation(selectedAnyAppWithAssessment);
  }, [review, selectedRows, getApplicationAssessment]);

  useEffect(() => {
    setConfirmationAccepted(false);
  }, [requestConfirmation]);

  // Copy
  const onSubmit = () => {
    if (requestConfirmation && !confirmationAccepted) {
      console.log("Accept confirmation to continue");
      return;
    }

    setIsSubmitting(true);

    createBulkCopyAssessment({
      fromAssessmentId: assessment.id!,
      applications: selectedRows.map((f) => ({ applicationId: f.id! })),
    })
      .then((bulkAssessment) => {
        const bulkReview = review
          ? createBulkCopyReview({
              sourceReview: review!.id!,
              targetApplications: selectedRows.map((f) => f.id!),
            })
          : undefined;
        return Promise.all([bulkAssessment, bulkReview]);
      })
      .then(([assessmentBulk, reviewBulk]) => {
        setIsSubmitting(false);

        dispatch(
          bulkCopyActions.scheduleWatchBulk({
            assessmentBulk: assessmentBulk.data.bulkId!,
            reviewBulk: reviewBulk ? reviewBulk.data.id! : undefined,
          })
        );
        onSaved();
      })
      .catch((error) => {
        setIsSubmitting(false);

        dispatch(alertActions.addDanger(getAxiosErrorMessage(error)));
        onSaved();
      });
  };
  const handleOnClearAllFilters = () => {
    setFilterValues({});
  };

  return (
    <div className="pf-c-form">
      <Card>
        <CardBody style={{ padding: 0 }}>
          <AppTableWithControls
            variant="compact"
            withoutBottomPagination
            count={applications ? applications.length : 0}
            paginationProps={paginationProps}
            sortBy={sortBy}
            onSort={onSort}
            onSelect={selectRow}
            canSelectAll={false}
            cells={columns}
            rows={rows}
            isLoading={isFetching}
            loadingVariant="skeleton"
            fetchError={fetchError}
            toolbarClearAllFilters={handleOnClearAllFilters}
          />
        </CardBody>
      </Card>
      {requestConfirmation && (
        <FormGroup
          fieldId="confirm"
          label={
            <>
              <span aria-label="warning-icon">
                <ExclamationTriangleIcon noVerticalAlign color={gold.value} />
              </span>
              &nbsp;&nbsp;
              {review
                ? t("message.copyAssessmentAndReviewQuestion")
                : t("message.copyAssessmentQuestion")}
            </>
          }
          isStack
        >
          {review
            ? t("message.copyAssessmentAndReviewBody")
            : t("message.copyAssessmentBody")}
          <Checkbox
            id="confirm"
            name="confirm"
            label={t("message.continueConfirmation")}
            aria-label="Confirm"
            isChecked={confirmationAccepted}
            onChange={(isChecked) => setConfirmationAccepted(isChecked)}
          />
        </FormGroup>
      )}
      <ActionGroup>
        <Button
          type="button"
          aria-label="copy"
          variant={ButtonVariant.primary}
          onClick={onSubmit}
          isDisabled={
            selectedRows.length === 0 ||
            (requestConfirmation && !confirmationAccepted) ||
            isSubmitting
          }
        >
          {t("actions.copy")}
        </Button>
      </ActionGroup>
    </div>
  );
};
