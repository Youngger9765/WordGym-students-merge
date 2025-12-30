import React, { useState, useMemo } from 'react';
import { VocabularyWord, POS_LABEL, POSType, UserSettings } from '../../types';
import { useSpeech } from '../../hooks/useSpeech';
import { useFavorites } from '../../hooks/useFavorites';
import { VersionService } from '../../services/VersionService';
import SpeakerButton from '../ui/SpeakerButton';

interface WordDetailPageProps {
  word: VocabularyWord;
  userSettings: UserSettings | null;
}

export const WordDetailPage: React.FC<WordDetailPageProps> = ({ word, userSettings }) => {
  const { speak } = useSpeech();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  // Filter textbook_index and theme_index based on user's stage
  const normalizedUserStage = useMemo(() =>
    VersionService.normalizeStage(userSettings?.stage || ''),
    [userSettings?.stage]
  );

  // 國中 textbook versions
  const juniorVersions = ['康軒', '翰林', '南一'];
  // 高中 textbook versions
  const seniorVersions = ['龍騰', '三民', '遠東'];

  const filteredTextbookIndex = useMemo(() => {
    if (!word.textbook_index || !normalizedUserStage) return word.textbook_index;

    return word.textbook_index.filter(item => {
      if (normalizedUserStage === 'junior') {
        // Show only junior high textbook versions
        return juniorVersions.includes(item.version);
      } else if (normalizedUserStage === 'senior') {
        // Show only senior high textbook versions
        return seniorVersions.includes(item.version);
      }
      return true; // Show all if stage unknown
    });
  }, [word.textbook_index, normalizedUserStage]);

  const shouldShowThemeIndex = normalizedUserStage === 'junior';
  const shouldShowLevel = normalizedUserStage === 'senior';
  const [exportSections, setExportSections] = useState<Record<string, boolean>>({
    pos: true,
    relations: true,
    affix: true
  });
  const [mdPreview, setMdPreview] = useState('');
  const [mdStatus, setMdStatus] = useState('');
  const [showMdPreview, setShowMdPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleToggleFavorite = () => {
    // Removed logging);
    if (isFavorite(word.id)) {
      // Removed logging;
      removeFavorite(word.id);
    } else {
      // Removed logging;
      addFavorite(word.id);
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const toggleExportSection = (key: string) => {
    setExportSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const wordToMarkdown = (): string => {
    const lines: string[] = [];
    lines.push(`## ${word.english_word}`);
    lines.push('');

    // Basic info
    lines.push('### 基本資訊');
    if (word.kk_phonetic) lines.push(`- KK音標：${word.kk_phonetic}`);
    if (word.posTags?.length) {
      const posText = word.posTags?.map(p => POS_LABEL[p as POSType] || p).join('、') || '';
      lines.push(`- 詞性：${posText}`);
    }
    if (word.level) lines.push(`- Level：${word.level}`);
    if (word.chinese_definition) lines.push(`- 中文定義：${word.chinese_definition}`);
    lines.push('');

    // Examples
    if (word.example_sentence || word.example_sentence_2) {
      lines.push('### 例句');
      if (word.example_sentence) {
        lines.push(`- 例句1：${word.example_sentence}`);
        if (word.example_translation) lines.push(`  → ${word.example_translation}`);
      }
      if (word.example_sentence_2) {
        lines.push(`- 例句2：${word.example_sentence_2}`);
        if (word.example_translation_2) lines.push(`  → ${word.example_translation_2}`);
      }
      lines.push('');
    }

    // POS section
    if (exportSections.pos) {
      const wordForms = word.word_forms ? String(word.word_forms).split('\n').filter(Boolean) : [];
      if (wordForms.length || word.grammar_sub_category || word.grammar_function) {
        lines.push('### 詞性');
        if (word.grammar_sub_category) lines.push(`- 子分類：${word.grammar_sub_category}`);
        if (word.grammar_function) lines.push(`- 語法功能：${word.grammar_function}`);
        if (wordForms.length) lines.push(`- 詞性變化：${wordForms.join('、')}`);
        lines.push('');
      }
    }

    // Relations section
    if (exportSections.relations) {
      const hasSynonyms = word.synonyms && word.synonyms.length > 0;
      const hasAntonyms = word.antonyms && word.antonyms.length > 0;
      const hasConfusables = word.confusables && word.confusables.length > 0;

      if (hasSynonyms || hasAntonyms || hasConfusables) {
        lines.push('### 同義／反義／易混淆');
        if (hasSynonyms) lines.push(`- 同義字：${word.synonyms!.join('、')}`);
        if (hasAntonyms) lines.push(`- 反義字：${word.antonyms!.join('、')}`);
        if (hasConfusables) lines.push(`- 易混淆字：${word.confusables!.join('、')}`);
        lines.push('');
      }
    }

    // Affix section
    if (exportSections.affix && word.affix_info && typeof word.affix_info === 'object') {
      const affix = word.affix_info;
      if (affix.prefix || affix.root || affix.suffix || affix.meaning || affix.example) {
        lines.push('### 字根字首字尾');
        if (affix.prefix) lines.push(`- 字首：${affix.prefix}`);
        if (affix.root) lines.push(`- 字根：${affix.root}`);
        if (affix.suffix) lines.push(`- 字尾：${affix.suffix}`);
        if (affix.meaning) lines.push(`- 字源意涵：${affix.meaning}`);
        if (affix.example) lines.push(`- 延伸例子：${affix.example}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  };

  const handleOutput = () => {
    const md = wordToMarkdown();
    setMdPreview(md);
    if (!md || !md.trim()) {
      setMdStatus('無匯出內容');
      setShowMdPreview(false);
    } else {
      setMdStatus('已產生 Markdown');
      setShowMdPreview(true);
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(mdPreview);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      // Fallback: select textarea
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.select();
        try {
          document.execCommand('copy');
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 2000);
        } catch (fallbackErr) {
          console.error('Copy failed:', fallbackErr);
        }
      }
    }
  };

  // Parse word forms for display
  const getWordFormsList = () => {
    if (!word.word_forms) return [];

    // If word_forms is an array of objects (structured format)
    if (Array.isArray(word.word_forms)) {
      return word.word_forms;
    }

    // If it's a string, split by newline (legacy format)
    return String(word.word_forms).split('\n').filter(line => line.trim());
  };

  // Check if relations exist
  const hasRelations = () => {
    return (word.synonyms && word.synonyms.length > 0) ||
           (word.antonyms && word.antonyms.length > 0) ||
           (word.confusables && word.confusables.length > 0);
  };

  const wordFormsList = getWordFormsList();
  const isFav = isFavorite(word.id);

  // Type guard for affix_info
  const affixInfo = typeof word.affix_info === 'object' ? word.affix_info : null;

  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      <div className="max-w-5xl mx-auto px-4 pt-6">
        {/* Top action bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-800 text-sm font-medium transition duration-150 min-h-[44px] flex items-center"
            >
              ← 返回
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleToggleFavorite}
              className={`px-4 py-2 rounded-lg font-medium transition duration-150 min-h-[44px] ${
                isFav
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {isFav ? '移除重點訓練' : '加入重點訓練'}
            </button>
          </div>
        </div>

        {/* Main content card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          {/* Word and pronunciation */}
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <h1 className="text-4xl font-bold text-gray-900">{word.english_word}</h1>
            <SpeakerButton onClick={() => speak(word.english_word)} />
            {word.kk_phonetic && (
              <div className="text-xl font-medium text-indigo-600">{word.kk_phonetic}</div>
            )}
          </div>

          {/* Chinese definition */}
          <div className="mb-4">
            <p className="text-lg text-gray-900 whitespace-pre-wrap">
              {word.chinese_definition || '—'}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Stage */}
            {word.stage && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-slate-50 text-slate-700">
                {word.stage === '高中' || word.stage === 'senior' ? '高中' :
                 word.stage === '國中' || word.stage === 'junior' ? '國中' :
                 word.stage === '國小' || word.stage === 'beginner' ? '國小' : word.stage}
              </span>
            )}

            {/* Level - only show for senior high */}
            {shouldShowLevel && word.level && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-700">
                Level {word.level}
              </span>
            )}

            {/* POS Tags */}
            {word.posTags?.map((pos, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700"
              >
                {POS_LABEL[pos as POSType] || pos}
              </span>
            ))}

            {/* CEFR */}
            {word.cefr && (
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-50 text-purple-700">
                {word.cefr}
              </span>
            )}

            {/* Textbook Index - filtered by stage */}
            {filteredTextbookIndex && filteredTextbookIndex.length > 0 && filteredTextbookIndex.map((item, idx) => (
              <span
                key={`tb-${idx}`}
                className="px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700"
              >
                {item.version} {item.vol} {item.lesson}
              </span>
            ))}

            {/* Exam Tags */}
            {word.exam_tags && word.exam_tags.length > 0 && word.exam_tags.map((tag, idx) => (
              <span
                key={`exam-${idx}`}
                className="px-3 py-1 rounded-full text-sm font-medium bg-red-50 text-red-700"
              >
                {tag}
              </span>
            ))}

            {/* Theme Index - only show for junior high */}
            {shouldShowThemeIndex && word.theme_index && word.theme_index.length > 0 && word.theme_index.map((item, idx) => (
              <span
                key={`theme-${idx}`}
                className="px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700"
              >
                {item.range} - {item.theme}
              </span>
            ))}
          </div>
        </div>

        {/* Video section */}
        {word.videoUrl && word.videoUrl.trim() && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">學習影片</h2>
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${word.videoUrl}`}
                title={`${word.english_word} - 學習影片`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Example sentences section */}
        {(word.example_sentence || word.example_sentence_2) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">例句</h2>
            <div className="space-y-4">
              {word.example_sentence && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-gray-900 mb-2">{word.example_sentence}</p>
                  {word.example_translation && (
                    <p className="text-gray-600 text-sm">{word.example_translation}</p>
                  )}
                </div>
              )}
              {word.example_sentence_2 && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                  <p className="text-gray-900 mb-2">{word.example_sentence_2}</p>
                  {word.example_translation_2 && (
                    <p className="text-gray-600 text-sm">{word.example_translation_2}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Word forms and relations card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">詞性與關聯字</h2>

          <div className="space-y-6">
            {/* Word forms */}
            {wordFormsList.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-gray-500 mb-2">詞性變化</div>
                <div className="px-4 py-3 rounded-lg bg-indigo-50 border border-indigo-200 grid gap-4 md:grid-cols-2">
                  {wordFormsList.map((form, idx) => {
                    // Check if it's structured format (object with pos and details)
                    if (typeof form === 'object' && form.pos && form.details) {
                      // Parse details into separate lines for better readability
                      const detailLines = form.details
                        .split(/[；\n]/) // Split by semicolon or newline
                        .map(line => line.trim())
                        .filter(line => line.length > 0);

                      return (
                        <div
                          key={idx}
                          className="pl-3 border-l-4 border-indigo-400 text-sm text-indigo-900"
                        >
                          <div className="font-bold mb-1">{form.pos}</div>
                          <div className="space-y-0.5 ml-2">
                            {detailLines.map((line, lineIdx) => (
                              <div key={lineIdx}>{line}</div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                    // Legacy format: just a string
                    return (
                      <div
                        key={idx}
                        className="pl-3 border-l-4 border-indigo-400 text-sm text-indigo-900"
                      >
                        {typeof form === 'string' ? form.trim() : String(form)}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Phrases */}
            {word.phrases && word.phrases.length > 0 && (
              <div>
                <div className="text-sm font-semibold text-gray-500 mb-2">片語</div>
                <div className="flex flex-wrap gap-2">
                  {word.phrases.map((phrase, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium border border-purple-200"
                    >
                      {phrase}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {!wordFormsList.length && !word.phrases?.length && (
              <p className="text-gray-500 text-sm">無額外關聯資訊</p>
            )}
          </div>
        </div>

        {/* Synonyms / Antonyms / Confusables */}
        {hasRelations() && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">同義／反義／易混淆</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {word.synonyms && word.synonyms.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-2">同義字</div>
                  <div className="flex flex-wrap gap-2">
                    {word.synonyms.map((syn, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          window.location.hash = `#/word/${syn}`;
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium border border-blue-200 hover:bg-blue-100 transition cursor-pointer"
                      >
                        {syn}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {word.antonyms && word.antonyms.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-2">反義字</div>
                  <div className="flex flex-wrap gap-2">
                    {word.antonyms.map((ant, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          window.location.hash = `#/word/${ant}`;
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-sm font-medium border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
                      >
                        {ant}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {word.confusables && word.confusables.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-400 mb-2">易混淆字</div>
                  <div className="flex flex-wrap gap-2">
                    {word.confusables.map((conf, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          window.location.hash = `#/word/${conf}`;
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                        title="點擊查看差異"
                      >
                        {conf}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Affix card */}
        {word.affix_info && (affixInfo?.prefix || affixInfo?.root || affixInfo?.suffix) && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {[
                affixInfo?.prefix && '字首',
                affixInfo?.suffix && '字尾',
                affixInfo?.root && '字根'
              ].filter(Boolean).join('｜') || '字首｜字尾｜字根'}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {affixInfo?.prefix && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">字首</div>
                  <div className="text-base text-gray-900">{affixInfo?.prefix}</div>
                </div>
              )}
              {affixInfo?.suffix && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1">字尾</div>
                  <div className="text-base text-gray-900">{affixInfo?.suffix}</div>
                </div>
              )}
              {affixInfo?.root && (
                <div className="md:col-span-2">
                  <div className="text-xs font-semibold text-gray-500 mb-1">字根</div>
                  <div className="text-base text-gray-900">{affixInfo?.root}</div>
                </div>
              )}
              {affixInfo?.meaning && (
                <div className="md:col-span-2">
                  <div className="text-xs font-semibold text-gray-500 mb-1">意思</div>
                  <div className="text-base text-gray-900 whitespace-pre-wrap">{affixInfo?.meaning}</div>
                </div>
              )}
              {affixInfo?.example && (
                <div className="md:col-span-2">
                  <div className="text-xs font-semibold text-gray-500 mb-1">例子</div>
                  <div className="text-base text-gray-900 whitespace-pre-wrap">{affixInfo?.example}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Export card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <details>
            <summary className="cursor-pointer list-none text-lg font-semibold text-gray-800 flex items-center gap-2">
              匯出內容
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-gray-500 text-xs"></span>
            </summary>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-700">
              {[
                { key: 'pos' as const, label: '詞性區塊' },
                { key: 'relations' as const, label: '同義／反義／易混淆' },
                { key: 'affix' as const, label: '字根字首字尾' }
              ].map((opt) => (
                <label key={opt.key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportSections[opt.key]}
                    onChange={() => toggleExportSection(opt.key)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
              <div className="flex justify-end gap-2 pt-2 w-full">
                <button
                  onClick={handleOutput}
                  className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  匯出 Markdown
                </button>
              </div>
            </div>
          </details>
        </div>

        {/* Export status and preview */}
        {mdStatus && (
          <div className="flex items-center justify-end gap-2 mb-4">
            <span className="text-sm text-gray-500">{mdStatus}</span>
            {showMdPreview && (
              <button
                onClick={handleCopyMarkdown}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition duration-150 ${
                  copySuccess
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                }`}
              >
                {copySuccess ? '✓ 已複製!' : '複製'}
              </button>
            )}
          </div>
        )}
        {showMdPreview && (
          <div className="mt-3 mb-4">
            <textarea
              value={mdPreview}
              readOnly
              className="w-full h-32 md:h-40 px-3 py-2 rounded-lg border border-gray-300 text-xs font-mono bg-white/80"
            />
            <div className="mt-1 text-xs text-gray-400 text-right">
              選取並複製後即可貼到 Google 文件／投影片。
            </div>
          </div>
        )}
      </div>
    </div>
  );
};