# def reciprocal_rank_fusion(results: list[list], k=60) -> list[tuple]:
#     """Reciprocal_rank_fusion that takes multiple lists of ranked documents
#     and an optional parameter k used in the RRF formula"""
#     # Initialize a dictionary to hold fused scores for each unique document
#     fused_scores = {}
#     # Iterate through each list of ranked documents
#     for docs in results:
#         # Iterate through each document in the list, with its rank (position in the list)
#         for rank, doc in enumerate(docs):
#             # Convert the document to a string format to use as a key (assumes documents can be serialized to JSON)
#             doc_str = dumps(doc)
#             # If the document is not yet in the fused_scores dictionary, add it with an initial score of 0
#             if doc_str not in fused_scores:
#                 fused_scores[doc_str] = 0
#             # Retrieve the current score of the document, if any
#             previous_score = fused_scores[doc_str]
#             # Update the score of the document using the RRF formula: 1 / (rank + k)
#             fused_scores[doc_str] += 1 / (rank + k)

#     # Sort the documents based on their fused scores in descending order to get the final reranked results
#     reranked_results = [
#         (loads(doc), score)
#         for doc, score in sorted(fused_scores.items(), key=lambda x: x[1], reverse=True)
#     ]

#     # Return the reranked results as a list of tuples, each containing the document and its fused score
#     return reranked_results


# def call_reciprocal_rank_fusion(query: str, k=3):
#     """Generates k queries and calls reciprocal_rank_fusion on them"""

#     template = """You are an AI language model assistant. Your task is to generate three
#     different versions of the given user question to retrieve relevant documents from a vector
#     database. By generating multiple perspectives on the user question, your goal is to help
#     the user overcome some of the limitations of the distance-based similarity search.
#     Provide these alternative questions separated by newlines. Original question: {question} \n
#     Output (3 queries):"""
#     prompt_rag_fusion = ChatPromptTemplate.from_template(template)

#     document_retriever = document_vectorstore.as_retriever(
#         search_type="similarity", search_kwargs={"k": k}
#     )

#     generate_queries = (
#         prompt_rag_fusion
#         | ChatOpenAI(model="gpt-4o-mini", temperature=0)
#         | StrOutputParser()
#         | (lambda x: x.split("\n"))
#     )

#     rag_fusion_retrieval_chain = (
#         generate_queries | document_retriever.map() | reciprocal_rank_fusion
#     )

#     result = rag_fusion_retrieval_chain.invoke(query)

#     print(type(result))

#     print(result[0])
#     for i in range(len(result)):
#         print(f"Score #{i + 1}: {result[i][1]}\n")
#         print("-----")
