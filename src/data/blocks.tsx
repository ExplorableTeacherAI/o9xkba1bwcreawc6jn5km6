import { type ReactElement } from "react";

// Initialize variables and their colors from this file's variable definitions
import { useVariableStore, initializeVariableColors } from "@/stores";
import { getDefaultValues, variableDefinitions } from "./variables";
useVariableStore.getState().initialize(getDefaultValues());
initializeVariableColors(variableDefinitions);

import { orientLinearFeedbackShiftRegistersBlocks } from "./sections/orientLinearFeedbackShiftRegisters";
import { oneClockTickBlocks } from "./sections/oneClockTick";
import { whereTheXorGoesBlocks } from "./sections/whereTheXorGoes";
import { theSequenceComesBackAroundBlocks } from "./sections/theSequenceComesBackAround";
import { oneStreamBothEndsBlocks } from "./sections/oneStreamBothEnds";
import { wrappingUpBlocks } from "./sections/wrappingUp";

export const blocks: ReactElement[] = [
    ...orientLinearFeedbackShiftRegistersBlocks,
    ...oneClockTickBlocks,
    ...whereTheXorGoesBlocks,
    ...theSequenceComesBackAroundBlocks,
    ...oneStreamBothEndsBlocks,
    ...wrappingUpBlocks,
];
