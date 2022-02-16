import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import { useFormik, FormikProvider, FormikHelpers, useField } from "formik";
import { object, string } from "yup";
import {
  ActionGroup,
  Alert,
  Button,
  ButtonVariant,
  ExpandableSection,
  FileUpload,
  Form,
  FormGroup,
  SelectVariant,
  TextArea,
  TextInput,
} from "@patternfly/react-core";

import {
  OptionWithValue,
  SingleSelectFetchOptionValueFormikField,
} from "@app/shared/components";
import { DEFAULT_SELECT_MAX_HEIGHT } from "@app/Constants";
import { createIdentity, TagTypeSortBy, updateIdentity } from "@app/api/rest";
import { Identity, Tag } from "@app/api/models";
import {
  getAxiosErrorMessage,
  getValidatedFromError,
  getValidatedFromErrorTouched,
} from "@app/utils/utils";

import "./identity-form.css";

export interface FormValues {
  application: number;
  createTime: string;
  createUser: string;
  description: string;
  encrypted: string;
  id: number;
  key: string;
  kind: OptionWithValue<"" | string>;
  name: string;
  password: string;
  settings: string;
  updateUser: string;
  user: string;
  userCredentials: OptionWithValue<"" | string>;
}

export interface IdentityFormProps {
  identity?: Identity;
  onSaved: (response: AxiosResponse<Identity>) => void;
  onCancel: () => void;
}

export const IdentityForm: React.FC<IdentityFormProps> = ({
  identity,
  onSaved,
  onCancel,
}) => {
  const { t } = useTranslation();

  const [error, setError] = useState<AxiosError>();

  const initialValues: FormValues = {
    application: 0,
    createTime: "",
    createUser: "",
    description: "",
    encrypted: "",
    id: 0,
    key: "",
    kind: "",
    // kind: { value: "", toString: () => "" },
    name: "",
    password: "",
    settings: "",
    updateUser: "",
    user: "",
    userCredentials: "",
  };

  const validationSchema = object().shape({
    name: string()
      .trim()
      .required(t("validation.required"))
      .min(3, t("validation.minLength", { length: 3 }))
      .max(120, t("validation.maxLength", { length: 120 })),
    description: string()
      .trim()
      .max(250, t("validation.maxLength", { length: 250 })),
  });

  const onSubmit = (
    formValues: FormValues,
    formikHelpers: FormikHelpers<FormValues>
  ) => {
    const payload: Identity = {
      name: formValues.name.trim(),
      description: formValues.description.trim(),
      id: formValues.id,
      kind: formValues.kind.value.trim(),
      createUser: formValues.createUser.trim(),
    };

    let promise: AxiosPromise<Identity>;
    if (identity) {
      promise = updateIdentity({
        ...identity,
        ...payload,
      });
    } else {
      promise = createIdentity(payload);
    }
    promise
      .then((response) => {
        formikHelpers.setSubmitting(false);
        onSaved(response);
      })
      .catch((error) => {
        formikHelpers.setSubmitting(false);
        setError(error);
      });
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: initialValues,
    validationSchema: validationSchema,
    onSubmit: onSubmit,
  });

  const onChangeField = (value: string, event: React.FormEvent<any>) => {
    formik.handleChange(event);
  };

  const [file, setFile] = useState<File>();
  const [isFileRejected, setIsFileRejected] = useState(false);

  const handleFileRejected = () => {
    setIsFileRejected(true);
  };

  return (
    <FormikProvider value={formik}>
      <Form onSubmit={formik.handleSubmit}>
        {error && (
          <Alert
            variant="danger"
            isInline
            title={getAxiosErrorMessage(error)}
          />
        )}
        <FormGroup
          label={t("terms.name")}
          fieldId="name"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.name)}
          helperTextInvalid={formik.errors.name}
        >
          <TextInput
            type="text"
            name="name"
            aria-label="name"
            aria-describedby="name"
            isRequired={true}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.name}
            validated={getValidatedFromErrorTouched(
              formik.errors.name,
              formik.touched.name
            )}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.description")}
          fieldId="description"
          isRequired={false}
          validated={getValidatedFromError(formik.errors.description)}
          helperTextInvalid={formik.errors.description}
        >
          <TextInput
            type="text"
            name="description"
            aria-label="description"
            aria-describedby="description"
            isRequired={true}
            onChange={onChangeField}
            onBlur={formik.handleBlur}
            value={formik.values.description}
            validated={getValidatedFromErrorTouched(
              formik.errors.description,
              formik.touched.description
            )}
          />
        </FormGroup>
        <FormGroup
          label={t("terms.type")}
          fieldId="type"
          isRequired={true}
          validated={getValidatedFromError(formik.errors.kind)}
          helperTextInvalid={formik.errors.kind}
        >
          <SingleSelectFetchOptionValueFormikField
            fieldConfig={{ name: "kind" }}
            selectConfig={{
              variant: "typeahead",
              "aria-label": "type",
              "aria-describedby": "type",
              typeAheadAriaLabel: "type",
              toggleAriaLabel: "type",
              clearSelectionsAriaLabel: "type",
              removeSelectionAriaLabel: "type",
              placeholderText: t("message.selectIdentityType"),
              menuAppendTo: () => document.body,
              maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
              fetchError: undefined,
              isFetching: false,
            }}
            options={[
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
            ]}
            toOptionWithValue={(value) => {
              return {
                value,
                toString: () => value.toString(),
              };
            }}
          />
        </FormGroup>
        {formik.values?.kind?.value === "sc" && (
          <>
            <FormGroup
              label="User credentials"
              isRequired
              fieldId="userCredentials"
            >
              <SingleSelectFetchOptionValueFormikField
                fieldConfig={{ name: "userCredentials" }}
                selectConfig={{
                  variant: "typeahead",
                  "aria-label": "userCredentials",
                  "aria-describedby": "userCredentials",
                  typeAheadAriaLabel: "userCredentials",
                  toggleAriaLabel: "userCredentials",
                  clearSelectionsAriaLabel: "userCredentials",
                  removeSelectionAriaLabel: "userCredentials",
                  placeholderText: "",
                  menuAppendTo: () => document.body,
                  maxHeight: DEFAULT_SELECT_MAX_HEIGHT,
                  fetchError: undefined,
                  isFetching: false,
                }}
                options={[
                  {
                    value: "userpass",
                    toString: () => `Username/Password`,
                  },
                  {
                    value: "scm",
                    toString: () => `SCM Private Key/Passphrase`,
                  },
                ]}
                toOptionWithValue={(value) => {
                  return {
                    value,
                    toString: () => value.toString(),
                  };
                }}
              />
            </FormGroup>
            {formik.values?.userCredentials.value === "userpass" && (
              <>
                <FormGroup
                  label="Username"
                  fieldId="user"
                  isRequired={true}
                  validated={getValidatedFromError(formik.errors.user)}
                  helperTextInvalid={formik.errors.user}
                >
                  <TextInput
                    type="text"
                    name="user"
                    aria-label="user"
                    aria-describedby="user"
                    isRequired={true}
                    onChange={onChangeField}
                    onBlur={formik.handleBlur}
                    value={formik.values.user}
                    validated={getValidatedFromErrorTouched(
                      formik.errors.user,
                      formik.touched.user
                    )}
                  />
                </FormGroup>
                <FormGroup
                  label="Password"
                  fieldId="password"
                  isRequired={true}
                  validated={getValidatedFromError(formik.errors.password)}
                  helperTextInvalid={formik.errors.password}
                >
                  <TextInput
                    type="text"
                    name="password"
                    aria-label="password"
                    aria-describedby="password"
                    isRequired={true}
                    onChange={onChangeField}
                    onBlur={formik.handleBlur}
                    value={formik.values.password}
                    validated={getValidatedFromErrorTouched(
                      formik.errors.password,
                      formik.touched.password
                    )}
                  />
                </FormGroup>
              </>
            )}
            {formik.values?.userCredentials.value === "scm" && (
              <>
                <FormGroup
                  fieldId="key"
                  label={
                    "Upload your [SCM Private Key] file or paste its contents below."
                  }
                  helperTextInvalid="You should select a private key file."
                  // validated={isFileRejected ? "error" : "default"}
                >
                  <FileUpload
                    id="file"
                    name="file"
                    value={formik.values.key}
                    filename={formik.values.key}
                    onChange={(value, filename) => {
                      if (filename && typeof value !== "string") {
                        setFile(value);
                        setIsFileRejected(false);
                      } else if (!filename) {
                        setFile(undefined);
                      }
                    }}
                    dropzoneProps={{
                      // accept: ".csv",
                      onDropRejected: handleFileRejected,
                    }}
                    validated={isFileRejected ? "error" : "default"}
                  />
                </FormGroup>
                <FormGroup
                  label="Password"
                  fieldId="password"
                  isRequired={true}
                  validated={getValidatedFromError(formik.errors.password)}
                  helperTextInvalid={formik.errors.password}
                >
                  <TextInput
                    type="text"
                    name="password"
                    aria-label="password"
                    aria-describedby="password"
                    isRequired={true}
                    onChange={onChangeField}
                    onBlur={formik.handleBlur}
                    value={formik.values.password}
                    validated={getValidatedFromErrorTouched(
                      formik.errors.password,
                      formik.touched.password
                    )}
                  />
                </FormGroup>
              </>
            )}
          </>
        )}
        <ActionGroup>
          <Button
            type="submit"
            aria-label="submit"
            variant={ButtonVariant.primary}
            isDisabled={
              !formik.isValid ||
              !formik.dirty ||
              formik.isSubmitting ||
              formik.isValidating
            }
          >
            {!identity ? t("actions.create") : t("actions.save")}
          </Button>
          <Button
            type="button"
            aria-label="cancel"
            variant={ButtonVariant.link}
            isDisabled={formik.isSubmitting || formik.isValidating}
            onClick={onCancel}
          >
            {t("actions.cancel")}
          </Button>
        </ActionGroup>
      </Form>
    </FormikProvider>
  );
};
