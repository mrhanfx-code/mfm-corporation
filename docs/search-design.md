# BM25 Search Design

**Project**: MFM Corporation
**Phase**: Phase 3 - Core Enhancements
**Created**: 2026-05-31
**Owner**: Sage (Backend Engineer)

---

## Overview

BM25 (Best Matching 25) is a ranking function used in information retrieval to estimate the relevance of documents to a given search query. This document outlines the design for implementing BM25 search for KV memory in MFM Corporation.

## BM25 Algorithm

### Formula

```
score(D, Q) = Σ IDF(qi) * (f(qi, D) * (k1 + 1)) / (f(qi, D) + k1 * (1 - b + b * |D| / avgdl))
```

Where:
- `D` = document
- `Q` = query
- `qi` = query term i
- `f(qi, D)` = frequency of term qi in document D
- `|D|` = length of document D in words
- `avgdl` = average document length in the corpus
- `k1` = term frequency saturation parameter (typically 1.2-2.0)
- `b` = length normalization parameter (typically 0.75)
- `IDF(qi)` = inverse document frequency of term qi

### IDF Formula

```
IDF(qi) = log((N - df(qi) + 0.5) / (df(qi) + 0.5) + 1)
```

Where:
- `N` = total number of documents in corpus
- `df(qi)` = number of documents containing term qi

## Implementation Strategy

### Phase 1: Document Indexing

1. **Extract documents from KV memory**
   - Retrieve all memory entries from KV namespace
   - Parse content into documents
   - Store document metadata (agent, userId, timestamp)

2. **Preprocess documents**
   - Tokenize text (split on whitespace, punctuation)
   - Convert to lowercase
   - Remove stop words (optional, for performance)
   - Calculate document length in words

3. **Build inverted index**
   - Map each term to list of (documentId, frequency)
   - Store in memory or KV for fast lookup
   - Calculate document frequency (df) for each term

4. **Calculate corpus statistics**
   - Total documents (N)
   - Average document length (avgdl)
   - Store for BM25 scoring

### Phase 2: Query Processing

1. **Tokenize query**
   - Split query into terms
   - Convert to lowercase
   - Remove stop words (if used in indexing)

2. **Retrieve candidate documents**
   - For each query term, get documents from inverted index
   - Union all candidate documents
   - Filter to top N candidates (performance optimization)

### Phase 3: Scoring

1. **Calculate BM25 score for each candidate**
   - For each query term in document:
     - Calculate term frequency (f)
     - Calculate IDF
     - Apply BM25 formula
   - Sum scores across all query terms

2. **Rank results**
   - Sort by BM25 score (descending)
   - Return top K results

## Integration with KV Memory

### Memory Structure

```
KV Namespace: agent_memory
Key Format: memory:{agent}:{userId}:{timestamp}
Value: { role, content, metadata }
```

### Indexing Strategy

**Option 1: Rebuild index on each search**
- Simpler implementation
- Slower for large datasets
- Suitable for <1000 documents

**Option 2: Maintain persistent index**
- Store index in KV
- Update on memory write
- Faster searches
- More complex implementation

**Recommendation**: Start with Option 1, optimize to Option 2 if performance issues.

## Performance Considerations

### Optimization Strategies

1. **Caching**
   - Cache inverted index in memory
   - Rebuild only when memory changes
   - TTL-based cache invalidation

2. **Query optimization**
   - Limit candidate documents to top 100
   - Use term frequency thresholds
   - Early termination for high-scoring documents

3. **Incremental updates**
   - Update index incrementally on memory writes
   - Avoid full rebuilds
   - Track index version

### Estimated Performance

- Indexing: 100ms for 1000 documents
- Search: 50ms for typical query
- Memory: ~10MB for 1000 documents

## Parameters

### Default Values

- `k1`: 1.2 (term frequency saturation)
- `b`: 0.75 (length normalization)
- Stop words: Enabled (common English words)
- Max results: 10
- Min score: 0.0

### Tuning

Adjust parameters based on retrieval accuracy:
- Higher `k1`: More emphasis on term frequency
- Lower `b`: Less emphasis on document length
- Disable stop words: Better for technical queries

## Testing Strategy

### Unit Tests

1. **Tokenization**
   - Test with various text formats
   - Verify stop word removal
   - Test edge cases (empty, special characters)

2. **Indexing**
   - Test with sample documents
   - Verify inverted index structure
   - Test corpus statistics calculation

3. **Scoring**
   - Test BM25 formula with known values
   - Verify ranking order
   - Test with multi-term queries

### Integration Tests

1. **End-to-end search**
   - Index real KV memory
   - Execute sample queries
   - Verify results relevance

2. **Performance**
   - Measure indexing time
   - Measure search latency
   - Verify memory usage

## Next Steps

1. Implement BM25 class in `src/core/search-engine.js`
2. Add tokenization and preprocessing
3. Build inverted index from KV memory
4. Implement query processing and scoring
5. Add caching layer
6. Write unit tests
7. Integrate with existing memory system
8. Measure and optimize performance

## References

- BM25 Wikipedia: https://en.wikipedia.org/wiki/Okapi_BM25
- Information Retrieval: Modern Information Retrieval
- Elasticsearch BM25: https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules-bm25.html
