import { PLAYABLE_CASES } from "../../src/lib/domain/cases";

export const cases = PLAYABLE_CASES.map(({ id, title }) => ({ id, title }));
