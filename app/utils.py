def diff_phonemes(expected, actual):
    return ''.join('✅' if e == a else '❌' for e, a in zip(expected, actual))