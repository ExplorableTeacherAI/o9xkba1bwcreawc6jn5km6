import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH2, EditableParagraph, InlineFormula, InlineTooltip } from "@/components/atoms";
import { LFSR } from "../lfsrPalette";

export const wrappingUpBlocks: ReactElement[] = [
    <StackLayout key="layout-wrapping-up-heading" maxWidth="xl">
        <Block id="wrapping-up-heading" padding="md">
            <EditableH2 id="h2-wrapping-up-heading" blockId="wrapping-up-heading">
                Wrapping Up
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-wrapping-up-idea" maxWidth="xl">
        <Block id="wrapping-up-idea" padding="sm">
            <EditableParagraph id="para-wrapping-up-idea" blockId="wrapping-up-idea">
                So the noise was never noise. A few cells, one XOR gate and a primitive tap
                polynomial of degree n buy a period of{" "}
                <InlineFormula
                    latex="\clr{period}{P} = 2^{\clr{degree}{n}} - 1"
                    colorMap={{ period: LFSR.period, degree: LFSR.degree }}
                />
                , a stream as balanced as an odd-length window allows, and the ability to
                regenerate every bit of it from the taps and the starting state. Scrambling a
                frame, testing a chip and keying a cipher all want exactly that pairing of
                unpredictable-looking and perfectly repeatable.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-wrapping-up-next" maxWidth="xl">
        <Block id="wrapping-up-next" padding="sm">
            <EditableParagraph id="para-wrapping-up-next" blockId="wrapping-up-next">
                It also marks the boundary. Linearity is what makes the circuit cheap and it is
                also its undoing: the{" "}
                <InlineTooltip color="#64748B" bgColor="rgba(100, 116, 139, 0.15)" id="tooltip-wrapping-linear-complexity" tooltip="The linear complexity of a sequence is the length of the shortest LFSR that can produce it. For an m-sequence of degree n it is exactly n, which is as low as it could be.">
                    linear complexity
                </InlineTooltip>
                {" "}of an m-sequence is only n, so the{" "}
                <InlineTooltip color="#64748B" bgColor="rgba(100, 116, 139, 0.15)" id="tooltip-wrapping-berlekamp" tooltip="The Berlekamp-Massey algorithm reconstructs the shortest LFSR consistent with a given output sequence, in time quadratic in its length.">
                    Berlekamp-Massey algorithm
                </InlineTooltip>
                {" "}rebuilds the entire tap polynomial from any{" "}
                <InlineFormula latex="2\clr{degree}{n}" colorMap={{ degree: LFSR.degree }} />
                {" "}consecutive output bits. Real ciphers therefore combine several registers
                through a nonlinear function, and that is where the next topic begins.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
