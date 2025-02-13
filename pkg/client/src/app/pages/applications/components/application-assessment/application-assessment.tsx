import React from "react";
import { AxiosError } from "axios";
import { useTranslation } from "react-i18next";

import {
  EmptyTextMessage,
  StatusIcon,
  StatusIconType,
} from "@app/shared/components";
import { Assessment } from "@app/api/models";

export interface ApplicationAssessmentProps {
  assessment?: Assessment;
  isFetching: boolean;
  fetchError?: AxiosError;
  fetchCount: number;
}

const getStatusIconFrom = (assessment: Assessment): StatusIconType => {
  switch (assessment.status) {
    case "EMPTY":
      return "NotStarted";
    case "STARTED":
      return "InProgress";
    case "COMPLETE":
      return "Completed";
    default:
      return "NotStarted";
  }
};

export const ApplicationAssessment: React.FC<ApplicationAssessmentProps> = ({
  assessment,
  isFetching,
  fetchError,
  fetchCount,
}) => {
  const { t } = useTranslation();

  if (fetchError) {
    return <EmptyTextMessage message={t("terms.notAvailable")} />;
  }
  if (isFetching || fetchCount === 0) {
    return <></>;
  }

  return assessment ? (
    <StatusIcon status={getStatusIconFrom(assessment)} />
  ) : (
    <StatusIcon status="NotStarted" />
  );
};
