import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { VisualOptionCards } from "@/components/organisms";

export const theSequenceComesBackAroundBlocks: ReactElement[] = [
    <StackLayout key="layout-cycle-heading" maxWidth="xl">
        <Block id="cycle-heading" padding="md">
            <EditableH2 id="h2-cycle-heading" blockId="cycle-heading">
                The Sequence Comes Back Around
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cycle-finite-states" maxWidth="xl">
        <Block id="cycle-finite-states" padding="sm">
            <EditableParagraph id="para-cycle-finite-states" blockId="cycle-finite-states">
                Four cells can hold only sixteen different patterns, and each pattern completely
                fixes the one that follows it. So the register cannot wander forever. Sooner or
                later it walks into a pattern it has already been in, and from that moment it is
                locked into a loop, repeating the same output for as long as the clock runs.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-cycle-zero-trap" maxWidth="xl">
        <Block id="cycle-zero-trap" padding="sm">
            <EditableParagraph id="para-cycle-zero-trap" blockId="cycle-zero-trap">
                One of those sixteen is a trap. XOR a pile of zeros and you get a zero back, so
                all-zeros feeds itself and the register never escapes. That leaves fifteen states
                to play with, and the best possible loop visits every single one.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <Block key="cycle-visual" id="cycle-visual">
        <VisualOptionCards
            blockId="cycle-visual"
            cards={[
                {
                    id: "state-ring-trail",
                    title: "A ring of all sixteen states with the register's path drawn on it",
                    looks: "Imagine sixteen small labelled dots arranged in a circle, one for every pattern the four cells can hold, with the live register drawn beside them. Each tick moves a marker from one dot to the next and leaves a line behind, so the path slowly closes into a loop while the all-zeros dot sits untouched on its own.",
                    manipulate: "Click a dot to start the register in that state, then step the clock and watch the trail travel until it joins up with itself",
                    reveals: "The path always closes into a loop, and starting at all-zeros produces a loop of length one.",
                    paradigm: "temporal",
                    recommended: true,
                    secondView: {
                        shows: "The live register cells and the output bit each tick produces",
                        role: "constructing",
                        syncedBy: "the shared register state, plus a hover highlight linking a dot on the ring to the bit pattern in the cells",
                    },
                },
                {
                    id: "fill-the-ring",
                    title: "The same ring of states with a counter of how many have been visited",
                    looks: "Imagine the ring of sixteen dots, unvisited ones hollow and visited ones filled in, with a running count of how many have been reached. Switchable tap wires sit under the register, and changing them redraws the path from the same starting bits.",
                    manipulate: "Try different tap wirings and run the clock until the loop closes, aiming to fill in all fifteen usable dots",
                    reveals: "Only some tap choices sweep through every state; the others settle into short loops that miss most of the ring.",
                    paradigm: "goal",
                },
                {
                    id: "predict-the-repeat",
                    title: "An output strip with a movable marker for where the pattern will repeat",
                    looks: "Imagine a long strip of output bits streaming out of the register, looking as ragged as a coin-toss record. A movable marker can be slid along the strip, and when the clock runs on, the section that actually repeats lights up underneath it.",
                    manipulate: "Slide the marker to the bit where they think the pattern starts over, then run the clock to see the true repeat appear",
                    reveals: "A stream can look completely random and still repeat on a fixed, knowable schedule.",
                    paradigm: "prediction",
                },
            ]}
        />
    </Block>,

    <StackLayout key="layout-cycle-usefulness" maxWidth="xl">
        <Block id="cycle-usefulness" padding="sm">
            <EditableParagraph id="para-cycle-usefulness" blockId="cycle-usefulness">
                A loop through all fifteen states gives fifteen output bits with almost as many
                ones as zeros and no obvious pattern, yet anyone who knows the taps and the
                starting bits can reproduce them exactly. Looks random, is not random. That pair
                of properties is what the applications are built on.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
