"use client";

import type { GetPkRootScalarsReturnType } from "@renegade-fi/core";
import { getPkRootScalars } from "@renegade-fi/core/actions";
import React from "react";
import type { ConfigParameter } from "../types/properties.js";
import { useConfig } from "./useConfig.js";

export type UsePkRootParameters = ConfigParameter;

export type UsePkRootScalarsReturnType = GetPkRootScalarsReturnType;

export function usePkRootScalars(parameters: UsePkRootParameters = {}): UsePkRootScalarsReturnType {
    const config = useConfig(parameters);
    const pkRootScalars = React.useMemo(() => getPkRootScalars(config), [config]);
    return pkRootScalars;
}
