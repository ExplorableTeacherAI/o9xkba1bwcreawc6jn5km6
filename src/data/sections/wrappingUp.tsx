import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH2, EditableParagraph } from "@/components/atoms";

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
                So the noise was never noise. A few cells, one XOR gate and a well-chosen set of
                taps give a stream with a fair mix of ones and zeros, a long run before it repeats,
                and the ability to be regenerated bit for bit by anyone who knows where it
                started. Scrambling a frame, testing a chip and keying a cipher all want exactly
                that pairing of unpredictable-looking and perfectly repeatable.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-wrapping-up-next" maxWidth="xl">
        <Block id="wrapping-up-next" padding="sm">
            <EditableParagraph id="para-wrapping-up-next" blockId="wrapping-up-next">
                It also marks the boundary. Everything rests on the taps and the starting bits, and
                looking random is not the same as being hard to guess: the linearity that makes
                this circuit so cheap also lets an attacker rebuild it from enough of its own
                output. That is where the next topic begins.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
