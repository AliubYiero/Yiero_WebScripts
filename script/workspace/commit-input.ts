import {
    type CommitType,
    commitTypeError,
    normalizeSubject,
    parseCommitType,
    validateCommitType,
} from './commit-message';
import { type Asker, askUntilValid } from './prompt';

/** 位置参数切出来的原始形状：类型还没校验过。 */
export interface CommitInput {
    type: string;
    subject: string;
}

export type CommitInputOutcome =
    | { ok: true; type: CommitType; subject: string }
    | { ok: false; error: string };

type TypeOutcome =
    | { ok: true; type: CommitType }
    | { ok: false; error: string };

const TYPE_QUESTION = '提交类型（feat / fix / docs …）：';
const SUBJECT_QUESTION = '提交主题：';

/**
 * 位置参数的切法：第一个是类型，其余用空格拼成主题。
 *
 * 拼完再压成单行，`git commit -m` 里不会混进换行。
 */
export function parseCommitPositionals(
    positionals: readonly string[],
): CommitInput {
    const [first = '', ...rest] = positionals;
    return {
        type: first.trim(),
        subject: normalizeSubject(rest.join(' ')),
    };
}

/** 参数是否已经够用；不够就说明得问用户（或直接报用法）。 */
export function commitInputComplete(input: CommitInput): boolean {
    return input.type !== '' && input.subject !== '';
}

export type CommitPreflight =
    | { ok: true }
    | { ok: false; reason: 'incomplete' | 'bad-type'; error: string };

/**
 * 没有终端可问时的前置校验。
 *
 * 参数不够只是「该问却问不了」，交给调用方拼用法；参数给了但类型拼错
 * 则是实打实的错误，要把「未知提交类型」原样透出去。
 */
export function preflightCommit(
    positionals: readonly string[],
): CommitPreflight {
    const parsed = parseCommitPositionals(positionals);
    if (parsed.type !== '') {
        const problem = validateCommitType(parsed.type);
        if (problem !== null) {
            return { ok: false, reason: 'bad-type', error: problem };
        }
    }
    if (!commitInputComplete(parsed)) {
        return {
            ok: false,
            reason: 'incomplete',
            error: '提交参数不完整',
        };
    }
    return { ok: true };
}

/**
 * 定下提交类型：没给就问，给了就只校验。
 *
 * 打错的类型直接失败，不拿交互去掩盖——否则 `pnpm commit feta`
 * 会变成「问你要类型」，把拼写错误藏起来。
 */
async function resolveType(
    asker: Asker,
    raw: string,
): Promise<TypeOutcome> {
    let value = raw;
    if (value === '') {
        const answer = await askUntilValid(
            asker,
            TYPE_QUESTION,
            validateCommitType,
        );
        if (!answer.ok) {
            return answer;
        }
        value = answer.value;
    } else {
        const problem = validateCommitType(value);
        if (problem !== null) {
            return { ok: false, error: problem };
        }
    }

    // 走到这里时类型已经过校验，`null` 只是类型系统上的兜底
    const type = parseCommitType(value);
    return type === null
        ? { ok: false, error: commitTypeError(value) }
        : { ok: true, type };
}

/**
 * 补齐提交需要的类型与主题。
 *
 * - 参数给全：只做校验，不碰终端。
 * - 给了类型缺主题 / 两者都缺：逐项提问。
 *
 * 是否允许提问由调用方决定（非 TTY 时应当干脆报用法错误）。
 */
export async function collectCommitInput(
    asker: Asker,
    positionals: readonly string[],
): Promise<CommitInputOutcome> {
    const parsed = parseCommitPositionals(positionals);

    const type = await resolveType(asker, parsed.type);
    if (!type.ok) {
        return type;
    }

    let subject = parsed.subject;
    if (subject === '') {
        const answer = await askUntilValid(
            asker,
            SUBJECT_QUESTION,
            (value) => (value === '' ? '提交主题不能为空' : null),
        );
        if (!answer.ok) {
            return answer;
        }
        subject = normalizeSubject(answer.value);
    }

    if (subject === '') {
        return { ok: false, error: '提交主题不能为空' };
    }

    return { ok: true, type: type.type, subject };
}
