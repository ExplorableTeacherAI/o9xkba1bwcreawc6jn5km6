import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH1, EditableParagraph } from "@/components/atoms";

export const orientLinearFeedbackShiftRegistersBlocks: ReactElement[] = [
    <StackLayout key="layout-orient-title" maxWidth="xl">
        <Block id="orient-title" padding="md">
            <EditableH1 id="h1-orient-title" blockId="orient-title">
                Linear Feedback Shift Registers
            </EditableH1>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-orient-hook" maxWidth="xl">
        <Block id="orient-hook" padding="sm">
            <EditableParagraph id="para-orient-hook" blockId="orient-hook">
                Every Wi-Fi packet your phone sends goes out scrambled. Not encrypted, just
                scrambled: the transmitter XORs the data against a stream of bits that looks like
                noise, and the receiver XORs the very same stream back off it. That stream is not
                noise at all. It comes out of a handful of flip-flops and one XOR gate, a circuit
                small enough to sit in the corner of a chip and cheap enough to put in everything.
                It is called a linear feedback shift register.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-orient-promise" maxWidth="xl">
        <Block id="orient-promise" padding="sm">
            <EditableParagraph id="para-orient-promise" blockId="orient-promise">
                Here we build one bit by bit, then work out why that one cheap circuit earns its
                place in three different jobs: scrambling a transmission, testing a chip on the
                production line, and generating the keystream for a cipher. If you can read a
                string of bits and you know that 1 XOR 1 is 0, you already have everything you
                need to start.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
