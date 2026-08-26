import { type ReactElement } from "react";
import { StackLayout } from "@/components/layouts";
import { Block } from "@/components/templates";
import { EditableH2, EditableParagraph } from "@/components/atoms";
import { VisualOptionCards } from "@/components/organisms";

export const oneStreamBothEndsBlocks: ReactElement[] = [
    <StackLayout key="layout-both-ends-heading" maxWidth="xl">
        <Block id="both-ends-heading" padding="md">
            <EditableH2 id="h2-both-ends-heading" blockId="both-ends-heading">
                One Stream, Both Ends
            </EditableH2>
        </Block>
    </StackLayout>,

    <StackLayout key="layout-both-ends-double-xor" maxWidth="xl">
        <Block id="both-ends-double-xor" padding="sm">
            <EditableParagraph id="para-both-ends-double-xor" blockId="both-ends-double-xor">
                XOR a message against the register's stream and it turns into something that looks
                like noise. XOR that noise against the very same stream and the message walks back
                out unharmed, because any bit XORed with itself is 0. Nobody has to store the
                noise: two circuits with the same taps and the same starting bits generate it
                independently, in step.
            </EditableParagraph>
        </Block>
    </StackLayout>,

    <Block key="both-ends-visual" id="both-ends-visual">
        <VisualOptionCards
            blockId="both-ends-visual"
            cards={[
                {
                    id: "sender-receiver-pair",
                    title: "A sender and a receiver, each running its own copy of the same register",
                    looks: "Imagine a row of message bits on the left, a matching register underneath it, and the scrambled bits travelling along a wire to a second register on the right that hands back the recovered message. Both registers tick together, and every bit is shown as it is combined.",
                    manipulate: "Flip any bit of the message on the left and watch that change ripple down the wire and reappear, intact, on the right",
                    reveals: "The second XOR undoes the first exactly, so the same circuit both hides the message and recovers it.",
                    paradigm: "comparison",
                    recommended: true,
                    secondView: {
                        shows: "The receiving end: the arriving scrambled bits, its own register stream, and the recovered message",
                        role: "constructing",
                        syncedBy: "the shared message bits, taps and seed, plus a hover highlight linking each sent bit to the recovered bit it becomes",
                    },
                },
                {
                    id: "predict-recovered-bit",
                    title: "A scrambled bit arriving with an empty slot for the bit it will become",
                    looks: "Imagine one scrambled bit arriving at the receiver, the register's current stream bit shown right beneath it, and an empty outlined slot waiting for the result. Loose 0 and 1 tiles sit nearby, and the original message bit is revealed once a tile is dropped in.",
                    manipulate: "Drop a 0 or a 1 into the empty slot to say what the recovered bit should be, then compare it with the message bit that was actually sent",
                    reveals: "Recovering a bit is the same XOR operation as hiding it, applied a second time.",
                    targetsMisconception: "Students get confused about which bits feed the XOR and where its result goes",
                    paradigm: "prediction",
                },
                {
                    id: "knock-the-receiver-out-of-step",
                    title: "A receiver whose starting bits can be dragged away from the sender's",
                    looks: "Imagine the same sender and receiver, but the receiver's four starting cells can be changed by hand while the recovered message sits below in plain view. As soon as its bits differ from the sender's, the recovered text collapses into rubbish, and it snaps back the moment they agree.",
                    manipulate: "Change the receiver's starting bits and try to get the message readable again",
                    reveals: "Only the exact seed and taps recover the message, which is what turns those settings into a key.",
                    paradigm: "goal",
                },
            ]}
        />
    </Block>,

    <StackLayout key="layout-both-ends-three-jobs" maxWidth="xl">
        <Block id="both-ends-three-jobs" padding="sm">
            <EditableParagraph id="para-both-ends-three-jobs" blockId="both-ends-three-jobs">
                That single trick covers all three jobs. A scrambler breaks up long runs of
                identical bits so a receiver can keep its timing. A stream cipher keeps the
                starting bits secret and calls them a key. A chip tester exploits the sweep
                through every state to flood a circuit with varied inputs from almost no hardware.
            </EditableParagraph>
        </Block>
    </StackLayout>,
];
