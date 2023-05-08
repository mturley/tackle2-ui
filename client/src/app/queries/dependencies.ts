import { useQuery } from "@tanstack/react-query";
import {
  AnalysisCompositeDependency,
  AnalysisDependency,
  HubPaginatedResult,
  HubRequestParams,
} from "@app/api/models";
import { getCompositeDependencies, getDependencies } from "@app/api/rest";
import { serializeRequestParamsForHub } from "@app/shared/hooks/table-controls/getHubRequestParams";

export interface ICompositeDependenciesFetchState {
  result: HubPaginatedResult<AnalysisCompositeDependency>;
  isFetching: boolean;
  fetchError: unknown;
  refetch: () => void;
}

export const CompositeDependenciesQueryKey = "dependencies";

export const useFetchCompositeDependencies = (
  params: HubRequestParams = {}
): ICompositeDependenciesFetchState => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      CompositeDependenciesQueryKey,
      serializeRequestParamsForHub(params).toString(),
    ],
    queryFn: async () => await getCompositeDependencies(params),
    onError: (error) => console.log("error, ", error),
    keepPreviousData: true,
  });
  return {
    result: data || { data: [], total: 0, params },
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};

export interface IDependenciesFetchState {
  result: HubPaginatedResult<AnalysisDependency>;
  isFetching: boolean;
  fetchError: unknown;
  refetch: () => void;
}

export const DependenciesQueryKey = "dependencies";

export const useFetchDependencies = (
  params: HubRequestParams = {}
): IDependenciesFetchState => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      DependenciesQueryKey,
      serializeRequestParamsForHub(params).toString(),
    ],
    queryFn: async () => await getDependencies(params),
    onError: (error) => console.log("error, ", error),
    keepPreviousData: true,
  });
  return {
    result: data || { data: [], total: 0, params },
    isFetching: isLoading,
    fetchError: error,
    refetch,
  };
};
